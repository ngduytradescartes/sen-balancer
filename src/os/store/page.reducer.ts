import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { account } from '@senswap/sen-js'

import PDB from 'shared/pdb'
import configs from 'os/configs'

const {
  register: { senreg, extra },
} = configs

/**
 * Interface & Utility
 */

export type PageState = {
  register: SenReg
  appIds: AppIds
  widgetIds: AppIds
}

const troubleshoot = (register: SenReg, appIds?: AppIds): AppIds => {
  if (!appIds || !Array.isArray(appIds)) return []
  return appIds.filter((appId) => register[appId])
}
const fetchRegister = async () => {
  try {
    const res = await fetch(senreg)
    return await res.json()
  } catch (er) {
    return {}
  }
}

/**
 * Store constructor
 */

const NAME = 'page'
const initialState: PageState = {
  register: {},
  appIds: [],
  widgetIds: [],
}

/**
 * Actions
 */

// Must fetch register at very first of the process
export const loadRegister = createAsyncThunk(
  `${NAME}/loadRegister`,
  async () => {
    const register = await fetchRegister()
    return { register: { ...register, ...extra } }
  },
)

// For sandbox only
export const installManifest = createAsyncThunk<
  Partial<PageState>,
  ComponentManifest,
  { state: any }
>(`${NAME}/installManifest`, async (manifest, { getState }) => {
  const {
    wallet: { address: walletAddress },
    page: { appIds, widgetIds, register },
  } = getState()
  if (!account.isAddress(walletAddress))
    throw new Error('Wallet is not connected yet.')
  if (appIds.includes(manifest.appId))
    throw new Error('Cannot run sandbox for an installed application.')
  const newAppIds: AppIds = [...appIds]
  newAppIds.push(manifest.appId)
  const newWidgetIds: AppIds = [...widgetIds]
  if (manifest.supportedViews.includes('widget'))
    newWidgetIds.push(manifest.appId)
  const newRegister: SenReg = { ...register }
  newRegister[manifest.appId] = manifest
  return { appIds: newAppIds, widgetIds: newWidgetIds, register: newRegister }
})

/**
 * App Actions
 */
export const loadPage = createAsyncThunk<
  Partial<PageState>,
  void,
  { state: any }
>(`${NAME}/loadPage`, async (_, { getState }) => {
  const {
    wallet: { address: walletAddress },
    page: { register },
  } = getState()

  if (!account.isAddress(walletAddress))
    throw new Error('Wallet is not connected yet.')
  // Fetch user's apps
  const db = new PDB(walletAddress).createInstance('sentre')
  const appIds = troubleshoot(
    register,
    (await db.getItem('appIds')) || initialState.appIds,
  )
  const widgetIds = troubleshoot(
    register,
    (await db.getItem('widgetIds')) || initialState.widgetIds,
  )
  return { appIds, widgetIds }
})

export const updatePage = createAsyncThunk<
  Partial<PageState>,
  AppIds,
  { state: any }
>(`${NAME}/updatePage`, async (appIds, { getState }) => {
  const {
    wallet: { address: walletAddress },
    page: { register },
  } = getState()
  if (!account.isAddress(walletAddress))
    throw new Error('Wallet is not connected yet.')
  appIds = troubleshoot(register, appIds)
  const db = new PDB(walletAddress).createInstance('sentre')
  await db.setItem('appIds', appIds)
  return { appIds }
})

export const installApp = createAsyncThunk<
  Partial<PageState>,
  string,
  { state: any }
>(`${NAME}/installApp`, async (appId, { getState }) => {
  const {
    wallet: { address: walletAddress },
    page: { register, appIds, widgetIds },
  } = getState()
  if (!account.isAddress(walletAddress))
    throw new Error('Wallet is not connected yet.')
  if (appIds.includes(appId)) return {}
  const newAppIds: AppIds = [...appIds]
  newAppIds.push(appId)
  const newWidgetIds = register[appId]?.supportedViews?.includes('widget')
    ? [...widgetIds, appId]
    : [...widgetIds]
  const db = new PDB(walletAddress).createInstance('sentre')
  await db.setItem('appIds', newAppIds)
  await db.setItem('widgetIds', newWidgetIds)
  return { appIds: newAppIds, widgetIds: newWidgetIds }
})

export const uninstallApp = createAsyncThunk<
  Partial<PageState>,
  string,
  { state: any }
>(`${NAME}/uninstallApp`, async (appId, { getState }) => {
  const {
    wallet: { address: walletAddress },
    page: { appIds, widgetIds },
  } = getState()
  if (!account.isAddress(walletAddress))
    throw new Error('Wallet is not connected yet.')
  if (!appIds.includes(appId)) return {}
  const newAppIds = appIds.filter((_appId: string) => _appId !== appId)
  const newWidgetIds = widgetIds.filter((_appId: string) => _appId !== appId)
  const pdb = new PDB(walletAddress)
  const db = pdb.createInstance('sentre')
  await db.setItem('appIds', newAppIds)
  await db.setItem('widgetIds', newWidgetIds)
  await pdb.dropInstance(appId)
  return { appIds: newAppIds, widgetIds: newWidgetIds }
})

/**
 * Dashboard Actions
 */
export const updateDashboard = createAsyncThunk<
  Partial<PageState>,
  AppIds,
  { state: any }
>(`${NAME}/updateDashboard`, async (widgetIds, { getState }) => {
  const {
    wallet: { address: walletAddress },
  } = getState()
  if (!account.isAddress(walletAddress))
    throw new Error('Wallet is not connected yet.')
  const db = new PDB(walletAddress).createInstance('sentre')
  await db.setItem('widgetIds', widgetIds)
  return { widgetIds }
})

export const addWidgets = createAsyncThunk<
  Partial<PageState>,
  AppIds,
  { state: any }
>(`${NAME}/addWidgets`, async (appIds, { getState }) => {
  const {
    wallet: { address: walletAddress },
    page: { widgetIds },
  } = getState()
  if (!account.isAddress(walletAddress))
    throw new Error('Wallet is not connected yet')
  const newWidgetIds: AppIds = [...widgetIds, ...appIds]
  const db = new PDB(walletAddress).createInstance('sentre')
  await db.setItem('widgetIds', newWidgetIds)
  return { widgetIds: newWidgetIds }
})

export const removeWidget = createAsyncThunk<
  Partial<PageState>,
  string,
  { state: any }
>(`${NAME}/removeWidget`, async (appId, { getState }) => {
  const {
    wallet: { address: walletAddress },
    page: { widgetIds },
  } = getState()
  if (!account.isAddress(walletAddress))
    throw new Error('Wallet is not connected yet.')
  if (!widgetIds.includes(appId)) return {}
  const newWidgetIds = widgetIds.filter((_appId: string) => _appId !== appId)
  const db = new PDB(walletAddress).createInstance('sentre')
  await db.setItem('widgetIds', newWidgetIds)
  return { widgetIds: newWidgetIds }
})

/**
 * Usual procedure
 */

const slice = createSlice({
  name: NAME,
  initialState,
  reducers: {},
  extraReducers: (builder) =>
    void builder
      .addCase(
        loadRegister.fulfilled,
        (state, { payload }) => void Object.assign(state, payload),
      )
      .addCase(
        installManifest.fulfilled,
        (state, { payload }) => void Object.assign(state, payload),
      )
      .addCase(
        loadPage.fulfilled,
        (state, { payload }) => void Object.assign(state, payload),
      )
      .addCase(
        updatePage.fulfilled,
        (state, { payload }) => void Object.assign(state, payload),
      )
      .addCase(
        installApp.fulfilled,
        (state, { payload }) => void Object.assign(state, payload),
      )
      .addCase(
        uninstallApp.fulfilled,
        (state, { payload }) => void Object.assign(state, payload),
      )
      .addCase(
        updateDashboard.fulfilled,
        (state, { payload }) => void Object.assign(state, payload),
      )
      .addCase(
        addWidgets.fulfilled,
        (state, { payload }) => void Object.assign(state, payload),
      )
      .addCase(
        removeWidget.fulfilled,
        (state, { payload }) => void Object.assign(state, payload),
      ),
})

export default slice.reducer

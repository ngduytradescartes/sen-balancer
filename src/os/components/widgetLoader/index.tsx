import { Suspense, forwardRef, useCallback } from 'react'
import { RemoteModule } from 'react-dynamic-remote-component/dist/types/types'
import { useRemoteModule } from 'react-dynamic-remote-component'

import { Row, Col, Typography, Button, Spin } from 'antd'
import WidgetContainer from './widgetContainer'
import ErrorBoundary from 'os/components/errorBoundary'
import IonIcon from 'shared/antd/ionicon'

/**
 * Remote component
 */
const RemoteComponent = forwardRef<HTMLElement, { manifest: RemoteModule }>(
  ({ manifest, ...props }, ref) => {
    const { Widget: Component, widgetConfig } = useRemoteModule(manifest)
    return (
      <WidgetContainer {...widgetConfig}>
        <Component {...props} ref={ref} />
      </WidgetContainer>
    )
  },
)

/**
 * Fallback component
 */
const WidgetLoading = () => (
  <WidgetContainer>
    <Row style={{ height: '100%' }} align="middle" justify="center">
      <Spin />
    </Row>
  </WidgetContainer>
)

/**
 * Error component
 */
const WidgetError = ({ url = 'Unknown' }: { url?: string }) => {
  const retry = () => window.location.reload()
  const support = useCallback(() => {
    return window.open(
      `mailto:hi@sentre.io?subject=${url} has failed`,
      '_blank',
    )
  }, [url])

  return (
    <WidgetContainer>
      <Row
        gutter={[8, 8]}
        style={{ height: '100%' }}
        align="middle"
        justify="center"
      >
        <Col span={24}>
          <Typography.Title level={4} style={{ textAlign: 'center' }}>
            {url}
          </Typography.Title>
        </Col>
        <Col span={24}>
          <p style={{ textAlign: 'center' }}>
            Oops! The application can't load properly.
          </p>
        </Col>
        <Col span={12}>
          <Button type="text" onClick={support} block>
            Support
          </Button>
        </Col>
        <Col span={12}>
          <Button
            type="primary"
            onClick={retry}
            icon={<IonIcon name="reload-outline" />}
            block
          >
            Retry
          </Button>
        </Col>
      </Row>
    </WidgetContainer>
  )
}

const WidgetLoader = forwardRef<HTMLElement, ComponentManifest>(
  ({ url, appId, ...props }, ref) => {
    const manifest = { url, scope: appId, module: './bootstrap' }
    return (
      <ErrorBoundary defaultChildren={<WidgetError url={url} />}>
        <Suspense fallback={<WidgetLoading />}>
          <RemoteComponent manifest={manifest} {...props} ref={ref} />
        </Suspense>
      </ErrorBoundary>
    )
  },
)

export default WidgetLoader

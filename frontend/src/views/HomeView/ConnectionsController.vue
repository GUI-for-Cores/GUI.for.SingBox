<script lang="ts" setup>
import { ref, onUnmounted } from 'vue'

import type { Menu } from '@/stores'
import { useBool, useMessage } from '@/hooks'
import type { KernelConnectionsWS } from '@/api/kernel.schema'
import { formatBytes, formatRelativeTime, ignoredError, addToRuleSet } from '@/utils'
import { getKernelConnectionsWS, deleteConnection, updateProvidersRules } from '@/api/kernel'

import type { Column } from '@/components/Table/index.vue'

type TrafficCacheType = { up: number; down: number }
const TrafficCache: Record<string, TrafficCacheType> = {}

const columns: Column[] = [
  {
    title: 'home.connections.host',
    key: 'metadata.host',
    sort: (a, b) => b.metadata.host.localeCompare(a.metadata.host),
    customRender: ({ value, record }) => {
      return (value || record.metadata.destinationIP) + ':' + record.metadata.destinationPort
    }
  },
  {
    title: 'home.connections.inbound',
    key: 'metadata.type',
    align: 'center',
    customRender: ({ value }) => value
  },
  {
    title: 'home.connections.rule',
    key: 'rule',
    align: 'center',
    sort: (a, b) => b.rule.localeCompare(a.rule),
    customRender: ({ value, record }) => {
      return value + (record.rulePayload ? '::' + record.rulePayload : '')
    }
  },
  {
    title: 'home.connections.chains',
    key: 'chains',
    sort: (a, b) => b.chains[0].localeCompare(a.chains[0]),
    customRender: ({ value }) => value[0]
  },
  {
    title: 'home.connections.uploadSpeed',
    key: 'up',
    align: 'center',
    minWidth: '90px',
    sort: (a, b) => b.upload - b.up - (a.upload - a.up),
    customRender: ({ value, record }) => formatBytes((record.upload - value) / 1000) + '/s'
  },
  {
    title: 'home.connections.downSpeed',
    key: 'down',
    align: 'center',
    minWidth: '90px',
    sort: (a, b) => b.download - b.down - (a.download - a.down),
    customRender: ({ value, record }) => formatBytes((record.download - value) / 1000) + '/s'
  },
  {
    title: 'home.connections.upload',
    align: 'center',
    key: 'upload',
    sort: (a, b) => b.upload - a.upload,
    customRender: ({ value }) => formatBytes(value)
  },
  {
    title: 'home.connections.download',
    align: 'center',
    key: 'download',
    sort: (a, b) => b.download - a.download,
    customRender: ({ value }) => formatBytes(value)
  },
  {
    title: 'home.connections.time',
    align: 'center',
    key: 'start',
    sort: (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
    customRender: ({ value }) => formatRelativeTime(value)
  }
]

const menu: Menu[] = [
  {
    label: 'common.details',
    handler: (record: Record<string, any>) => {
      details.value = JSON.stringify(record, null, 2)
      toggleDetails()
    }
  },
  {
    label: 'home.connections.close',
    handler: async (record: Record<string, any>) => {
      try {
        await deleteConnection(record.id)
      } catch (error: any) {
        console.log(error)
        message.error(error)
      }
    }
  }
  // ...[
  //   ['home.connections.addToDirect', 'direct'],
  //   ['home.connections.addToProxy', 'proxy'],
  //   ['home.connections.addToReject', 'block']
  // ].map(([label, ruleset]) => {
  //   return {
  //     label,
  //     handler: async (record: Record<string, any>) => {
  //       try {
  //         const behavior = record.metadata.host ? 'domain' : 'ip_cidr'
  //         const payload = record.metadata.host || record.metadata.destinationIP + '/32'
  //         await addToRuleSet(ruleset as any, behavior + ',' + payload)
  //         await ignoredError(updateProvidersRules, ruleset)
  //         message.success('common.success')
  //       } catch (error: any) {
  //         message.error(error)
  //         console.log(error)
  //       }
  //     }
  //   }
  // })
]

const details = ref()
const dataSource = ref<(KernelConnectionsWS['connections'][0] & TrafficCacheType)[]>([])
const [showDetails, toggleDetails] = useBool(false)
const { message } = useMessage()

const onConnections = (data: KernelConnectionsWS) => {
  dataSource.value = (data.connections || []).map((connection) => {
    const result = { ...connection, up: 0, down: 0 }
    const cache = TrafficCache[connection.id]
    result.up = cache?.up || connection.upload
    result.down = cache?.down || connection.download
    TrafficCache[connection.id] = {
      down: connection.download,
      up: connection.upload
    }
    return result
  })
}

const disconnect = getKernelConnectionsWS(onConnections)

onUnmounted(disconnect)
</script>

<template>
  <div class="connections">
    <Table :columns="columns" :menu="menu" :data-source="dataSource" sort="start" style="flex: 1" />
  </div>

  <Modal
    v-model:open="showDetails"
    :submit="false"
    cancel-text="common.close"
    max-height="90"
    max-width="90"
    mask-closable
  >
    <CodeViewer v-model="details" />
  </Modal>
</template>

<style lang="less" scoped></style>

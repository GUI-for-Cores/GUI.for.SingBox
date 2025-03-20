<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { computed, h, ref, type VNode } from 'vue'

import { useBool, useConfirm, useMessage } from '@/hooks'
import { sampleID, deepClone, generateDnsServerURL } from '@/utils'
import { DraggableOptions } from '@/constant/app'
import { DnsServerTypeOptions } from '@/constant/kernel'
import { DefaultDnsServer, DefaultDnsServers } from '@/constant/profile'
import { RuleAction, RuleType, Strategy } from '@/enums/kernel'
import { DefaultFakeIPDnsRule } from '@/constant/profile'

import Tag from '@/components/Tag/index.vue'
import { DnsServer } from '@/enums/kernel'

interface Props {
  outboundOptions: { label: string; value: string }[]
  serversOptions: { label: string; value: string }[]
  rules: IDNSRule[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'addRule', rule: IDNSRule): void
}>()

const model = defineModel<IDNSServer[]>({ default: DefaultDnsServers() })

let serverId = 0
const fields = ref<IDNSServer>(DefaultDnsServer())

const isSupportDetourAndDomainResolver = computed(() => {
  return [
    DnsServer.Local,
    DnsServer.Tcp,
    DnsServer.Udp,
    DnsServer.Tls,
    DnsServer.Quic,
    DnsServer.Https,
    DnsServer.H3,
    DnsServer.Dhcp,
  ].includes(fields.value.type as any)
})

const isSupportServerAndPort = computed(() => {
  return [
    DnsServer.Tcp,
    DnsServer.Udp,
    DnsServer.Tls,
    DnsServer.Quic,
    DnsServer.Https,
    DnsServer.H3,
  ].includes(fields.value.type as any)
})

const isSupportPath = computed(() =>
  [DnsServer.Https, DnsServer.H3].includes(fields.value.type as any),
)

const { t } = useI18n()
const { confirm } = useConfirm()
const { message } = useMessage()
const [showEditModal] = useBool(false)

const handleAdd = () => {
  serverId = -1
  fields.value = DefaultDnsServer()
  showEditModal.value = true
}

defineExpose({ handleAdd })

const handleAddEnd = () => {
  if (serverId !== -1) {
    model.value[serverId] = fields.value
  } else {
    model.value.unshift(fields.value)
  }
  onAddEnd(fields.value)
}

const onAddEnd = async (server: IDNSServer) => {
  if (server.type !== DnsServer.FakeIP) return
  if (props.serversOptions.find((v) => v.value === DnsServer.FakeIP)) return
  const fakeip_rule = props.rules.find(
    (v) => v.type === RuleType.Inline && v.payload.includes('__is_fake_ip'),
  )
  if (fakeip_rule) return

  if (!(await confirm('Tip', 'kernel.dns.rules.addRules').catch(() => 0))) {
    return
  }
  emit('addRule', {
    id: sampleID(),
    type: RuleType.Inline,
    payload: JSON.stringify(DefaultFakeIPDnsRule(), null, 2),
    action: RuleAction.Route,
    invert: false,
    server: server.id,
    strategy: Strategy.Default,
    disable_cache: false,
    client_subnet: '',
  })
  message.success('common.success')
}

const handleEdit = (index: number) => {
  serverId = index
  fields.value = deepClone(model.value[index])
  showEditModal.value = true
}

const handleDeleteRule = (index: number) => {
  model.value.splice(index, 1)
}

const renderServer = (server: IDNSServer) => {
  const { tag, detour } = server
  const children: VNode[] = [
    h(Tag, { color: 'cyan' }, () => tag),
    h(Tag, () => generateDnsServerURL(server)),
  ]
  if (detour) {
    const tag = props.outboundOptions.find((v) => v.value === detour)?.label || detour
    children.push(h(Tag, { color: 'default' }, () => tag))
  }
  return h('div', children)
}
</script>
<template>
  <Empty v-if="model.length === 0">
    <template #description>
      <Button @click="handleAdd" icon="add" type="primary" size="small">
        {{ t('common.add') }}
      </Button>
    </template>
  </Empty>

  <div v-draggable="[model, DraggableOptions]">
    <Card v-for="(server, index) in model" :key="server.id" class="server-item">
      <div class="font-bold flex items-center">
        <component :is="renderServer(server)" />
      </div>
      <div class="ml-auto">
        <Button @click="handleEdit(index)" icon="edit" type="text" size="small" />
        <Button @click="handleDeleteRule(index)" icon="delete" type="text" size="small" />
      </div>
    </Card>
  </div>

  <Modal
    v-model:open="showEditModal"
    @ok="handleAddEnd"
    title="kernel.dns.tab.servers"
    max-width="80"
    max-height="80"
  >
    <div class="flex flex-col">
      <div class="form-item">
        {{ t('kernel.dns.type.name') }}
        <Select v-model="fields.type" :options="DnsServerTypeOptions" />
      </div>
      <div class="form-item">
        {{ t('kernel.dns.tag') }}
        <Input v-model="fields.tag" autofocus />
      </div>
      <template v-if="isSupportDetourAndDomainResolver">
        <div class="form-item">
          {{ t('kernel.dns.domain_resolver') }}
          <Select v-model="fields.domain_resolver" :options="serversOptions" clearable />
        </div>
        <div class="form-item">
          {{ t('kernel.dns.detour') }}
          <Select v-model="fields.detour" :options="outboundOptions" />
        </div>
        <template v-if="isSupportServerAndPort">
          <div class="form-item">
            {{ t('kernel.dns.server') }}
            <Input v-model="fields.server" placeholder="192.168.1.1,223.5.5.5" />
          </div>
          <div class="form-item">
            {{ t('kernel.dns.server_port') }}
            <Input v-model="fields.server_port" placeholder="53,853,443,784" />
          </div>
          <div v-if="isSupportPath" class="form-item">
            {{ t('kernel.dns.path') }}
            <Input v-model="fields.path" placeholder="/dns-query" />
          </div>
        </template>
      </template>
      <template v-if="fields.type === DnsServer.Hosts">
        <div :class="{ 'flex-start': fields.hosts_path.length !== 0 }" class="form-item">
          {{ t('kernel.dns.hosts_path') }}
          <InputList v-model="fields.hosts_path" placeholder="/etc/hosts,c:\...\hosts" />
        </div>
        <div
          :class="{ 'flex-start': Object.keys(fields.predefined).length !== 0 }"
          class="form-item"
        >
          {{ t('kernel.dns.predefined') }}
          <KeyValueEditor
            v-model="fields.predefined"
            :placeholder="['google.com', '127.0.0.1,::1']"
          />
        </div>
      </template>
      <div v-else-if="fields.type === DnsServer.Dhcp" class="form-item">
        {{ t('kernel.dns.interface') }}
        <Input v-model="fields.interface" placeholder="wlan0,eth0" />
      </div>
      <template v-else-if="fields.type === DnsServer.FakeIP">
        <div class="form-item">
          {{ t('kernel.dns.inet4_range') }}
          <Input v-model="fields.inet4_range" placeholder="198.18.0.0/15" />
        </div>
        <div class="form-item">
          {{ t('kernel.dns.inet6_range') }}
          <Input v-model="fields.inet6_range" placeholder="fc00::/18" />
        </div>
      </template>
    </div>
  </Modal>
</template>

<style lang="less" scoped>
.server-item {
  display: flex;
  align-items: center;
  padding: 0 8px;
  margin-bottom: 2px;
  .warn {
    color: rgb(200, 193, 11);
    cursor: pointer;
  }
}
</style>

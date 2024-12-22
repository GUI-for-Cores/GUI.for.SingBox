<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n, I18nT } from 'vue-i18n'

import { useMessage } from '@/hooks'
import { Removefile, Writefile, BrowserOpenURL } from '@/bridge'
import { debounce, formatRelativeTime, ignoredError, formatDate } from '@/utils'
import { getProvidersRules, updateProvidersRules } from '@/api/kernel'
import { DraggableOptions } from '@/constant/app'
import { View } from '@/enums/app'
import { EmptyRuleSet } from '@/constant/kernel'
import { RulesetFormat } from '@/enums/kernel'
import { type RuleSetType, useRulesetsStore, useAppSettingsStore, useEnvStore } from '@/stores'

import RulesetForm from './components/RulesetForm.vue'
import RulesetView from './components/RulesetView.vue'
import RulesetHub from './components/RulesetHub.vue'

const showRulesetForm = ref(false)
const showRulesetList = ref(false)
const showRulesetHub = ref(false)
const rulesetTitle = ref('')
const rulesetFormID = ref()
const rulesetFormIsUpdate = ref(false)
const subFormTitle = computed(() => (rulesetFormIsUpdate.value ? 'common.edit' : 'common.add'))

const sourceMenuList: Menu[] = [
  {
    label: 'rulesets.editRuleset',
    handler: (id: string) => handleEditRulesetList(id)
  },
  {
    label: 'common.openFile',
    handler: (id: string) => {
      const ruleset = rulesetsStore.getRulesetById(id)
      BrowserOpenURL(envStore.env.basePath + '/' + ruleset!.path)
    }
  },
  {
    label: 'common.clear',
    handler: (id: string) => handleClearRuleset(id)
  }
]

const binaryMenuList: Menu[] = [
  {
    label: 'common.none',
    handler: (id: string) => {
      console.log(id)
      message.info('common.none')
    }
  }
]

const { t } = useI18n()
const { message } = useMessage()
const envStore = useEnvStore()
const rulesetsStore = useRulesetsStore()
const appSettingsStore = useAppSettingsStore()

const handleImportRuleset = async () => {
  showRulesetHub.value = true
}

const handleAddRuleset = async () => {
  rulesetFormIsUpdate.value = false
  showRulesetForm.value = true
}

const handleUpdateRulesets = async () => {
  try {
    await rulesetsStore.updateRulesets()
    await _updateAllProvidersRules()
    message.success('common.success')
  } catch (error: any) {
    console.error('updateRulesets: ', error)
    message.error(error)
  }
}

const handleEditRuleset = (r: RuleSetType) => {
  rulesetFormIsUpdate.value = true
  rulesetFormID.value = r.id
  showRulesetForm.value = true
}

const handleEditRulesetList = (id: string) => {
  const r = rulesetsStore.getRulesetById(id)
  if (r) {
    rulesetFormID.value = r.id
    rulesetTitle.value = r.tag
    showRulesetList.value = true
  }
}

const handleUpdateRuleset = async (r: RuleSetType) => {
  try {
    await rulesetsStore.updateRuleset(r.id)
    await _updateProvidersRules(r.tag)
  } catch (error: any) {
    console.error('updateRuleset: ', error)
    message.error(error)
  }
}

const handleDeleteRuleset = async (r: RuleSetType) => {
  try {
    await ignoredError(Removefile, r.path)
    await rulesetsStore.deleteRuleset(r.id)
  } catch (error: any) {
    console.error('deleteRuleset: ', error)
    message.error(error)
  }
}

const handleDisableRuleset = async (r: RuleSetType) => {
  r.disabled = !r.disabled
  rulesetsStore.editRuleset(r.id, r)
}

const handleClearRuleset = async (id: string) => {
  const r = rulesetsStore.getRulesetById(id)
  if (!r) return
  if (r.format != RulesetFormat.Source) return

  try {
    await Writefile(r.path, JSON.stringify(EmptyRuleSet, null, 2))
    await _updateProvidersRules(r.tag)
    rulesetsStore.editRuleset(r.id, r)
  } catch (error: any) {
    message.error(error)
    console.error(error)
  }
}

const onEditRuelsetListEnd = async () => {
  try {
    await _updateProvidersRules(rulesetTitle.value)
  } catch (error: any) {
    message.error(error)
    console.error(error)
  }
}

const _updateProvidersRules = async (ruleset: string) => {
  if (appSettingsStore.app.kernel.running) {
    const { providers } = await getProvidersRules()
    if (providers[ruleset]) {
      await updateProvidersRules(ruleset)
    }
  }
}

const _updateAllProvidersRules = async () => {
  if (appSettingsStore.app.kernel.running) {
    const { providers } = await getProvidersRules()
    const rulesets = Object.keys(providers)
    for (let i = 0; i < rulesets.length; i++) {
      await updateProvidersRules(rulesets[i])
    }
  }
}

const generateMenus = (r: RuleSetType) => {
  return {
    [RulesetFormat.Source]: sourceMenuList,
    [RulesetFormat.Binary]: binaryMenuList
  }[r.format].map((v) => ({ ...v, handler: () => v.handler?.(r.id) }))
}

const noUpdateNeeded = computed(() => rulesetsStore.rulesets.every((v) => v.disabled))

const onSortUpdate = debounce(rulesetsStore.saveRulesets, 1000)
</script>

<template>
  <div v-if="rulesetsStore.rulesets.length === 0" class="grid-list-empty">
    <Empty>
      <template #description>
        <I18nT keypath="rulesets.empty" tag="p" scope="global">
          <template #action>
            <Button @click="handleAddRuleset" type="link">{{ t('common.add') }}</Button>
          </template>
          <template #import>
            <Button @click="handleImportRuleset" type="link">{{ t('rulesets.hub') }}</Button>
          </template>
        </I18nT>
      </template>
    </Empty>
  </div>

  <div v-else class="grid-list-header">
    <Radio
      v-model="appSettingsStore.app.rulesetsView"
      :options="[
        { label: 'common.grid', value: View.Grid },
        { label: 'common.list', value: View.List }
      ]"
    />
    <Button @click="handleImportRuleset" type="link" class="ml-auto">
      {{ t('rulesets.hub') }}
    </Button>
    <Button
      @click="handleUpdateRulesets"
      :disabled="noUpdateNeeded"
      :type="noUpdateNeeded ? 'text' : 'link'"
    >
      {{ t('common.updateAll') }}
    </Button>
    <Button @click="handleAddRuleset" type="primary">
      {{ t('common.add') }}
    </Button>
  </div>

  <div
    v-draggable="[rulesetsStore.rulesets, { ...DraggableOptions, onUpdate: onSortUpdate }]"
    :class="'grid-list-' + appSettingsStore.app.rulesetsView"
  >
    <Card
      v-for="r in rulesetsStore.rulesets"
      :key="r.id"
      :title="r.tag"
      :disabled="r.disabled"
      v-menu="generateMenus(r)"
      class="item"
    >
      <template #title-prefix>
        <Tag v-if="r.updating" color="cyan">
          {{ t('ruleset.updating') }}
        </Tag>
      </template>

      <template v-if="appSettingsStore.app.rulesetsView === View.Grid" #extra>
        <Dropdown :trigger="['hover', 'click']">
          <Button type="link" size="small" icon="more" />
          <template #overlay>
            <Button
              :disabled="r.disabled"
              :loading="r.updating"
              :type="r.disabled ? 'text' : 'link'"
              size="small"
              @click="handleUpdateRuleset(r)"
            >
              {{ t('common.update') }}
            </Button>
            <Button type="link" size="small" @click="handleDisableRuleset(r)">
              {{ r.disabled ? t('common.enable') : t('common.disable') }}
            </Button>
            <Button type="link" size="small" @click="handleEditRuleset(r)">
              {{ t('common.edit') }}
            </Button>
            <Button type="link" size="small" @click="handleDeleteRuleset(r)">
              {{ t('common.delete') }}
            </Button>
          </template>
        </Dropdown>
      </template>

      <template v-else #extra>
        <Button
          :disabled="r.disabled"
          :loading="r.updating"
          :type="r.disabled ? 'text' : 'link'"
          size="small"
          @click="handleUpdateRuleset(r)"
        >
          {{ t('common.update') }}
        </Button>
        <Button type="link" size="small" @click="handleDisableRuleset(r)">
          {{ r.disabled ? t('common.enable') : t('common.disable') }}
        </Button>
        <Button type="link" size="small" @click="handleEditRuleset(r)">
          {{ t('common.edit') }}
        </Button>
        <Button type="link" size="small" @click="handleDeleteRuleset(r)">
          {{ t('common.delete') }}
        </Button>
      </template>

      <div v-if="r.format === RulesetFormat.Binary">
        {{ t('ruleset.format.name') }}
        :
        {{ r.format || '--' }}
      </div>

      <template v-if="appSettingsStore.app.rulesetsView === View.Grid">
        <div v-if="r.format === RulesetFormat.Source">
          {{ t('rulesets.rulesetCount') }}
          :
          {{ r.count }}
        </div>
        <div>
          {{ t('common.updateTime') }}
          :
          {{ r.updateTime ? formatRelativeTime(r.updateTime) : '--' }}
        </div>
      </template>
      <template v-else>
        <div v-if="r.format === RulesetFormat.Source">
          {{ t('rulesets.rulesetCount') }}
          :
          {{ r.count }}
        </div>
        <div>
          {{ t('common.updateTime') }}
          :
          {{ r.updateTime ? formatDate(r.updateTime, 'YYYY-MM-DD HH:mm:ss') : '--' }}
        </div>
      </template>
    </Card>
  </div>

  <Modal
    v-model:open="showRulesetForm"
    :title="subFormTitle"
    max-height="90"
    min-width="70"
    :footer="false"
  >
    <RulesetForm :is-update="rulesetFormIsUpdate" :id="rulesetFormID" />
  </Modal>

  <Modal
    v-model:open="showRulesetHub"
    title="rulesets.hub"
    :submit="false"
    mask-closable
    cancel-text="common.close"
    height="90"
    width="90"
  >
    <RulesetHub />
  </Modal>

  <Modal
    v-model:open="showRulesetList"
    :title="rulesetTitle"
    :footer="false"
    @ok="onEditRuelsetListEnd"
    height="90"
    width="90"
  >
    <RulesetView :id="rulesetFormID" />
  </Modal>
</template>

<style lang="less" scoped></style>

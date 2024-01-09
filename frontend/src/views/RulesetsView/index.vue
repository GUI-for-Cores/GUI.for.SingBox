<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n, I18nT } from 'vue-i18n'

import { View, EmptyRuleSet, RulesetFormat } from '@/constant'
import { useMessage } from '@/hooks'
import { Writefile } from '@/utils/bridge'
import { DraggableOptions } from '@/constant'
import { debounce, formatRelativeTime } from '@/utils'
import { getProvidersRules, updateProvidersRules } from '@/api/kernel'
import { type RuleSetType, type Menu, useRulesetsStore, useAppSettingsStore } from '@/stores'

import RulesetForm from './components/RulesetForm.vue'
import RulesetView from './components/RulesetView.vue'

const showRulesetForm = ref(false)
const showRulesetList = ref(false)
const rulesetTitle = ref('')
const rulesetFormID = ref()
const rulesetFormIsUpdate = ref(false)
const subFormTitle = computed(() => (rulesetFormIsUpdate.value ? 'common.edit' : 'common.add'))

const menuList: Menu[] = [
  {
    label: 'rulesets.editRuleset',
    handler: (id: string) => handleEditRulesetList(id)
  },
  {
    label: 'common.clear',
    handler: (id: string) => handleClearRuleset(id)
  }
]

const { t } = useI18n()
const { message } = useMessage()
const rulesetsStore = useRulesetsStore()
const appSettingsStore = useAppSettingsStore()

const handleAddRuleset = async () => {
  rulesetFormIsUpdate.value = false
  showRulesetForm.value = true
}

const handleUpdateRulesets = async () => {
  try {
    await rulesetsStore.updateRulesets()
    await _updateAllProvidersRules()
    message.info('common.success')
  } catch (error: any) {
    console.error('updateRulesets: ', error)
    message.info(error)
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
    // r.path
    rulesetFormID.value = r.id
    rulesetTitle.value = r.tag
    showRulesetList.value = true
  }
}

const handleUpdateRuleset = async (r: RuleSetType) => {
  try {
    await rulesetsStore.updateRuleset(r.id)
    await _updateProvidersRules(r.tag)
    message.info('common.success')
  } catch (error: any) {
    console.error('updateRuleset: ', error)
    message.info(error)
  }
}

const handleDeleteRuleset = async (s: RuleSetType) => {
  try {
    await rulesetsStore.deleteRuleset(s.id)
    message.info('common.success')
  } catch (error: any) {
    console.error('deleteRuleset: ', error)
    message.info(error)
  }
}

const handleDisableRuleset = async (r: RuleSetType) => {
  r.disabled = !r.disabled
  rulesetsStore.editRuleset(r.id, r)
  message.info('common.success')
}

const handleClearRuleset = async (id: string) => {
  const r = rulesetsStore.getRulesetById(id)
  if (!r) return
  if (r.format != RulesetFormat.Source) return

  try {
    await Writefile(r.path, JSON.stringify(EmptyRuleSet, null, 2))
    await _updateProvidersRules(r.tag)
    rulesetsStore.editRuleset(r.id, r)
    message.info('common.success')
  } catch (error: any) {
    message.info(error)
    console.log(error)
  }
}

const onEditRuelsetListEnd = async () => {
  try {
    await _updateProvidersRules(rulesetTitle.value)
  } catch (error: any) {
    message.info(error)
    console.log(error)
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

const noUpdateNeeded = computed(() => rulesetsStore.rulesets.every((v) => v.disabled))

const onSortUpdate = debounce(rulesetsStore.saveRulesets, 1000)
</script>

<template>
  <div v-if="rulesetsStore.rulesets.length !== 0" class="header">
    <Radio
      v-model="appSettingsStore.app.rulesetsView"
      :options="[
        { label: 'common.grid', value: View.Grid },
        { label: 'common.list', value: View.List }
      ]"
    />
    <Button
      @click="handleUpdateRulesets"
      :disable="noUpdateNeeded"
      :type="noUpdateNeeded ? 'text' : 'link'"
      style="margin-left: auto"
    >
      {{ t('common.updateAll') }}
    </Button>
    <Button @click="handleAddRuleset" type="primary">
      {{ t('common.add') }}
    </Button>
  </div>

  <div v-else class="empty">
    <Empty>
      <template #description>
        <I18nT keypath="rulesets.empty" tag="p" scope="global">
          <template #action>
            <Button @click="handleAddRuleset" type="link">{{ t('common.add') }}</Button>
          </template>
        </I18nT>
      </template>
    </Empty>
  </div>

  <div
    v-draggable="[rulesetsStore.rulesets, { ...DraggableOptions, onUpdate: onSortUpdate }]"
    :class="appSettingsStore.app.rulesetsView"
    class="rulesets"
  >
    <Card
      v-for="r in rulesetsStore.rulesets"
      :key="r.tag"
      :title="r.tag"
      :disabled="r.disabled"
      v-menu="
        r.format == RulesetFormat.Source
          ? menuList.map((v) => ({ ...v, handler: () => v.handler?.(r.id) }))
          : []
      "
      class="ruleset"
    >
      <template #title-prefix>
        <Tag v-if="r.updating" color="cyan">
          {{ t('ruleset.updating') }}
        </Tag>
      </template>

      <template v-if="appSettingsStore.app.rulesetsView === View.Grid" #extra>
        <Dropdown :trigger="['hover', 'click']">
          <Button type="link" size="small">
            {{ t('common.more') }}
          </Button>
          <template #overlay>
            <Button
              :disable="r.disabled"
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
          :disable="r.disabled"
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

      <div>
        {{ t('ruleset.format.name') }}
        :
        {{ r.format || '--' }}
      </div>

      <template v-if="appSettingsStore.app.rulesetsView === View.Grid">
        <div>
          {{ t('common.updateTime') }}
          :
          {{ r.updateTime ? formatRelativeTime(r.updateTime) : '--' }}
        </div>
      </template>
      <template v-else>
        <div>
          {{ t('common.updateTime') }}
          :
          {{ r.updateTime || '--' }}
        </div>
      </template>
    </Card>
  </div>

  <Modal v-model:open="showRulesetForm" :title="subFormTitle" max-height="80" :footer="false">
    <RulesetForm :is-update="rulesetFormIsUpdate" :id="rulesetFormID" />
  </Modal>

  <Modal
    v-model:open="showRulesetList"
    :title="rulesetTitle"
    :footer="false"
    @ok="onEditRuelsetListEnd"
    height="80"
    width="80"
  >
    <RulesetView :id="rulesetFormID" />
  </Modal>
</template>

<style lang="less" scoped>
.header {
  display: flex;
  align-items: center;
  padding: 0 8px;
  z-index: 9;
}

.empty {
  text-align: center;
  height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rulesets {
  flex: 1;
  margin-top: 8px;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.6;
}

.grid {
  .ruleset {
    display: inline-block;
    width: calc(33.333333% - 16px);
    margin: 8px;
  }
}
.list {
  .ruleset {
    margin: 8px;
  }
}
</style>

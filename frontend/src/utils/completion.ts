import { snippetCompletion, completeFromList } from '@codemirror/autocomplete'
import { scopeCompletionSource, localCompletionSource, snippets } from '@codemirror/lang-javascript'

import { PluginTriggerEvent } from '@/enums/app'
import i18n from '@/lang'

import type { CompletionContext, Completion } from '@codemirror/autocomplete'

export const getCompletions = (pluginScope: any = undefined) => {
  const { t } = i18n.global

  const snippetsCompletions: Completion[] = [
    /**
     * Built-In
     */
    ...snippets,
    /**
     * Plugin Triggers
     */
    snippetCompletion(
      `/* ${t('plugin.trigger') + ' ' + t('common.install')} */\n` +
        `const ${PluginTriggerEvent.OnInstall} = async () => {\n\t\${}\n\treturn 0\n}`,
      {
        label: PluginTriggerEvent.OnInstall,
        type: 'keyword',
        detail: t('plugin.trigger') + ' ' + t('common.install'),
      },
    ),
    snippetCompletion(
      `/* ${t('plugin.trigger') + ' ' + t('common.uninstall')} */\n` +
        `const ${PluginTriggerEvent.OnUninstall} = async () => {\n\t\${}\n\treturn 0\n}`,
      {
        label: PluginTriggerEvent.OnUninstall,
        type: 'keyword',
        detail: t('plugin.trigger') + ' ' + t('common.uninstall'),
      },
    ),
    snippetCompletion(
      `/* ${t('plugin.trigger') + ' ' + t('plugin.on::manual')} */\n` +
        `const ${PluginTriggerEvent.OnManual} = async () => {\n\t\${}\n}`,
      {
        label: PluginTriggerEvent.OnManual,
        type: 'keyword',
        detail: t('plugin.trigger') + ' ' + t('plugin.on::manual'),
      },
    ),
    snippetCompletion(
      `/* ${t('plugin.trigger') + ' ' + t('plugin.on::subscribe')} */\n` +
        `const ${PluginTriggerEvent.OnSubscribe} = async (proxies, subscription) => {\n\t\${}\n\treturn proxies\n}`,
      {
        label: PluginTriggerEvent.OnSubscribe,
        type: 'keyword',
        detail: t('plugin.trigger') + ' ' + t('plugin.on::subscribe'),
      },
    ),
    snippetCompletion(
      `/* ${t('plugin.trigger') + ' ' + t('plugin.on::generate')} */\n` +
        `const ${PluginTriggerEvent.OnGenerate} = async (config, profile) => {\n\t\${}\n\treturn config\n}`,
      {
        label: PluginTriggerEvent.OnGenerate,
        type: 'keyword',
        detail: t('plugin.trigger') + ' ' + t('plugin.on::generate'),
      },
    ),
    snippetCompletion(
      `/* ${t('plugin.trigger') + ' ' + t('plugin.on::startup')} */\n` +
        `const ${PluginTriggerEvent.OnStartup} = async () => {\n\t\${}\n}`,
      {
        label: PluginTriggerEvent.OnStartup,
        type: 'keyword',
        detail: t('plugin.trigger') + ' ' + t('plugin.on::startup'),
      },
    ),
    snippetCompletion(
      `/* ${t('plugin.trigger') + ' ' + t('plugin.on::shutdown')} */\n` +
        `const ${PluginTriggerEvent.OnShutdown} = async () => {\n\t\${}\n}`,
      {
        label: PluginTriggerEvent.OnShutdown,
        type: 'keyword',
        detail: t('plugin.trigger') + ' ' + t('plugin.on::shutdown'),
      },
    ),
    snippetCompletion(
      `/* ${t('plugin.trigger') + ' ' + t('plugin.on::core::started')} */\n` +
        `const ${PluginTriggerEvent.OnCoreStarted} = async () => {\n\t\${}\n}`,
      {
        label: PluginTriggerEvent.OnCoreStarted,
        type: 'keyword',
        detail: t('plugin.trigger') + ' ' + t('plugin.on::core::started'),
      },
    ),
    snippetCompletion(
      `/* ${t('plugin.trigger') + ' ' + t('plugin.on::core::stopped')} */\n` +
        `const ${PluginTriggerEvent.OnCoreStopped} = async () => {\n\t\${}\n}`,
      {
        label: PluginTriggerEvent.OnCoreStopped,
        type: 'keyword',
        detail: t('plugin.trigger') + ' ' + t('plugin.on::core::stopped'),
      },
    ),
    snippetCompletion(
      `/* ${t('plugin.trigger') + ' ' + t('plugin.on::before::core::start')} */\n` +
        `const ${PluginTriggerEvent.OnBeforeCoreStart} = async (config, profile) => {\n\t\${}\n\treturn config\n}`,
      {
        label: PluginTriggerEvent.OnBeforeCoreStart,
        type: 'keyword',
        detail: t('plugin.trigger') + ' ' + t('plugin.on::before::core::start'),
      },
    ),
    snippetCompletion(
      `/* ${t('plugin.trigger') + ' ' + t('plugin.on::before::core::stop')} */\n` +
        `const ${PluginTriggerEvent.OnBeforeCoreStop} = async () => {\n\t\${}\n}`,
      {
        label: PluginTriggerEvent.OnBeforeCoreStop,
        type: 'keyword',
        detail: t('plugin.trigger') + ' ' + t('plugin.on::before::core::stop'),
      },
    ),
    snippetCompletion(
      `/* ${t('plugin.trigger') + ' ' + t('plugin.on::ready')} */\n` +
        `const ${PluginTriggerEvent.OnReady} = async () => {\n\t\${}\n}`,
      {
        label: PluginTriggerEvent.OnReady,
        type: 'keyword',
        detail: t('plugin.trigger') + ' ' + t('plugin.on::ready'),
      },
    ),
    snippetCompletion(
      `/* ${t('plugin.trigger') + ' ' + t('plugin.on::task')} */\n` +
        `const ${PluginTriggerEvent.OnTask} = async () => {\n\t\${}\n}`,
      {
        label: PluginTriggerEvent.OnTask,
        type: 'keyword',
        detail: t('plugin.trigger') + ' ' + t('plugin.on::task'),
      },
    ),
    snippetCompletion(
      `/* ${t('plugin.trigger') + ' ' + t('plugin.on::configure')} */\n` +
        `const ${PluginTriggerEvent.OnConfigure} = async (config, old) => {\n\t\${}\n}`,
      {
        label: PluginTriggerEvent.OnConfigure,
        type: 'keyword',
        detail: t('plugin.trigger') + ' ' + t('plugin.on::configure'),
      },
    ),
    /**
     * Others
     */
    snippetCompletion('console.log(`[$\\{Plugin.name\\}]`, ${})', {
      label: 'log',
      type: 'keyword',
    }),
    snippetCompletion(
      "const { close } = await Plugins.StartServer('${address}', '${serverID}', async (req, res) => {\n\tres.end(200, {'Content-Type': 'application/json'}, 'Server is running...')\n})",
      {
        label: 'StartServer',
        type: 'keyword',
      },
    ),
    snippetCompletion(
      "await Plugins.Download('${url}', '${path}', {${headers}}, (progress, total) => {\n\t${}\n})",
      {
        label: 'Download',
        type: 'keyword',
      },
    ),
    snippetCompletion(
      "await Plugins.Upload('${url}', '${path}', {${headers}}, (progress, total) => {\n\t${}\n})",
      {
        label: 'Upload',
        type: 'keyword',
      },
    ),
    snippetCompletion(
      "const { status, headers, body } = await Plugins.Requests({\n\turl: '${url}', \n\tmethod: '${GET}', \n\theaders: {}, \n\tbody: '${body}'\n})",
      {
        label: 'Requests',
        type: 'keyword',
      },
    ),
    snippetCompletion(
      "const pid = await Plugins.ExecBackground(\n\t'${path}', \n\t[${args}], \n\tasync (out) => {\n\t\t${}\n\t}, \n\tasync () => {\n\t\t${}\n\t}\n)",
      {
        label: 'ExecBackground',
        type: 'keyword',
      },
    ),
  ]

  const completions = [
    /**
     * Global methods include all APIs of `Plugins` and `Plugin Metadata`
     */
    scopeCompletionSource({ ...window, Plugin: pluginScope }),
    /**
     * Code Snippets
     */
    completeFromList(snippetsCompletions),
    /**
     * Locally Defined
     */
    (context: CompletionContext) => {
      const word = context.matchBefore(/\w*/)
      if (!word || context.explicit) return null

      const codeCompletion = localCompletionSource(context) || { options: [] }

      return {
        from: word.from,
        options: codeCompletion.options,
      }
    },
  ]

  return completions
}

import type { CompletionContext, Completion } from '@codemirror/autocomplete'
import { snippetCompletion, completeFromList } from '@codemirror/autocomplete'
import { scopeCompletionSource, localCompletionSource, snippets } from '@codemirror/lang-javascript'

import i18n from '@/lang'

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
        'const onInstall = async () => {\n\t${}\n\treturn 0\n}',
      {
        label: 'onInstall',
        type: 'keyword',
        detail: t('plugin.trigger') + ' ' + t('common.install')
      }
    ),
    snippetCompletion(
      `/* ${t('plugin.trigger') + ' ' + t('common.uninstall')} */\n` +
        'const onUninstall = async () => {\n\t${}\n\treturn 0\n}',
      {
        label: 'onUninstall',
        type: 'keyword',
        detail: t('plugin.trigger') + ' ' + t('common.uninstall')
      }
    ),
    snippetCompletion(
      `/* ${t('plugin.trigger') + ' ' + t('plugin.on::manual')} */\n` +
        'const onRun = async () => {\n\t${}\n}',
      {
        label: 'onRun',
        type: 'keyword',
        detail: t('plugin.trigger') + ' ' + t('plugin.on::manual')
      }
    ),
    snippetCompletion(
      `/* ${t('plugin.trigger') + ' ' + t('plugin.on::subscribe')} */\n` +
        'const onSubscribe = async (proxies, subscription) => {\n\t${}\n}',
      {
        label: 'onSubscribe',
        type: 'keyword',
        detail: t('plugin.trigger') + ' ' + t('plugin.on::subscribe')
      }
    ),
    snippetCompletion(
      `/* ${t('plugin.trigger') + ' ' + t('plugin.on::generate')} */\n` +
        'const onGenerate = async (config, profile) => {\n\t${}\n}',
      {
        label: 'onGenerate',
        type: 'keyword',
        detail: t('plugin.trigger') + ' ' + t('plugin.on::generate')
      }
    ),
    snippetCompletion(
      `/* ${t('plugin.trigger') + ' ' + t('plugin.on::startup')} */\n` +
        'const onStartup = async () => {\n\t${}\n}',
      {
        label: 'onStartup',
        type: 'keyword',
        detail: t('plugin.trigger') + ' ' + t('plugin.on::startup')
      }
    ),
    snippetCompletion(
      `/* ${t('plugin.trigger') + ' ' + t('plugin.on::shutdown')} */\n` +
        'const onShutdown = async () => {\n\t${}\n}',
      {
        label: 'onShutdown',
        type: 'keyword',
        detail: t('plugin.trigger') + ' ' + t('plugin.on::shutdown')
      }
    ),
    snippetCompletion(
      `/* ${t('plugin.trigger') + ' ' + t('plugin.on::ready')} */\n` +
        'const onReady = async () => {\n\t${}\n}',
      {
        label: 'onReady',
        type: 'keyword',
        detail: t('plugin.trigger') + ' ' + t('plugin.on::ready')
      }
    ),
    snippetCompletion(
      `/* ${t('plugin.trigger') + ' ' + t('plugin.on::task')} */\n` +
        'const onTask = async () => {\n\t${}\n}',
      {
        label: 'onTask',
        type: 'keyword',
        detail: t('plugin.trigger') + ' ' + t('plugin.on::task')
      }
    ),
    snippetCompletion(
      `/* ${t('plugin.trigger') + ' ' + t('plugin.on::configure')} */\n` +
        'const onConfigure = async (config, old) => {\n\t${}\n}',
      {
        label: 'onConfigure',
        type: 'keyword',
        detail: t('plugin.trigger') + ' ' + t('plugin.on::configure')
      }
    ),
    /**
     * Others
     */
    snippetCompletion('console.log(`[$\\{Plugin.name\\}]`, ${})', {
      label: 'log',
      type: 'keyword'
    }),
    snippetCompletion(
      "const { close } = await Plugins.StartServer('${address}', '${serverID}', async (req, res) => {\n\tres.end(200, {'Content-Type': 'application/json'}, 'Server is running...')\n})",
      {
        label: 'StartServer',
        type: 'keyword'
      }
    ),
    snippetCompletion(
      "await Plugins.Download('${url}', '${path}', {${headers}}, (progress, total) => {\n\t${}\n})",
      {
        label: 'Download',
        type: 'keyword'
      }
    ),
    snippetCompletion(
      "await Plugins.Upload('${url}', '${path}', {${headers}}, (progress, total) => {\n\t${}\n})",
      {
        label: 'Upload',
        type: 'keyword'
      }
    ),
    snippetCompletion(
      "const { status, headers, body } = await Plugins.Requests({\n\turl: '${url}', \n\tmethod: '${GET}', \n\theaders: {}, \n\tbody: '${body}'\n})",
      {
        label: 'Requests',
        type: 'keyword'
      }
    ),
    snippetCompletion(
      "const pid = await Plugins.ExecBackground(\n\t'${path}', \n\t[${args}], \n\tasync (out) => {\n\t\t${}\n\t}, \n\tasync () => {\n\t\t${}\n\t}\n)",
      {
        label: 'ExecBackground',
        type: 'keyword'
      }
    )
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
        options: codeCompletion.options
      }
    }
  ]

  return completions
}

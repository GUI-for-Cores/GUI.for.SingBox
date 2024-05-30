import { useEnvStore } from '@/stores'
import { ignoredError } from '@/utils'
import { Exec, AbsolutePath } from '@/bridge'

export const setupKernelPermissions = async (kernelFilePath: string) => {
  const { os } = useEnvStore().env
  const absKernelFilePath = await AbsolutePath(kernelFilePath)

  if (os === 'darwin') {
    const shell = `chown root:admin ${absKernelFilePath}\nchmod +sx ${absKernelFilePath}`
    const command = `'do shell script "${shell}" with administrator privileges'`
    console.log(`osascript -e ${command}`)
    await ignoredError(Exec, 'osascript', ['-e', command])
  } else if (os === 'linux') {
    await ignoredError(Exec, 'chmod', ['+x', absKernelFilePath])
  }
}

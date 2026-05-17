// uno.config.ts
import { defineConfig, presetUno } from 'unocss'
import presetRemToPx from '@unocss/preset-rem-to-px'
export default defineConfig({
  // 使用基础预设，包含常用的原子化工具类
  presets: [
    presetUno(),
    presetRemToPx({
      baseFontSize: 4,  // 关键配置：1rem = 4px
    }),
  ],
  // 核心配置：指定需要扫描哪些文件
  content: {
    // 从构建管道中提取（推荐方式，性能最好）
    pipeline: {
      // include 数组定义哪些路径下的文件会被扫描
      include: [
        // 如果你只想让 UnoCSS 在 src/features 目录下生效
        'src/views/Customize/**/*.{vue,ts,js}',
        // 或者专门为某个模块新建一个目录，比如 src/unopages
      //  'src/unopages/**/*.{vue,ts,js}',
      ],
      // 注意：默认 pipeline 会排除 node_modules 和 .git 目录
      // 不需要额外配置 exclude
    },
    // 可选：如果项目复杂，还可以使用 filesystem 方式手动指定文件
    // filesystem: [
    //   'src/my_special_dir/**/*.vue',
    // ],
  },
  // 其他可选配置（如自定义规则、快捷方式等）
  // rules: [...],
  // shortcuts: {...},
})
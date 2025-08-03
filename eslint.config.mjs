import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';

export default [
  {
    files: ['**/*.{js,mjs,cjs,ts,vue}',],
    rules: {
      // 全局规则
      'no-multiple-empty-lines': ['error', {max: 1,},], // 不允许多行空行
      'comma-dangle': ['error', {
        objects: 'always',
        arrays: 'always',
        imports: 'always',
        exports: 'always',
        functions: 'never', // 函数参数最后一项是否加逗号，根据需要设为 'always' 或 'never'
      },], // 要求在多行对象或数组中使用拖尾逗号
      'no-unused-vars': 'off',  //非空允许
      'no-undef': 'off', // 禁用 no-undef 规则，避免类型未定义报错
      indent: ['error', 2,], // 使用两个空格进行缩进
      'no-console': 'warn', // 禁止使用 console.log 等，可以用来保持清洁的输出
      'no-debugger': 'warn', // 禁止使用 debugger
      semi: ['error', 'always',], // 要求语句末尾使用分号
      quotes: ['error', 'single',], // 强制使用单引号
      eqeqeq: ['error', 'always',], // 强制使用全等 ===/!== 操作符
      curly: ['error', 'all',], // 强制所有控制语句使用大括号

    },
  },
  //  ignorePatterns: ["node_modules","package.json"],
  {
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['**/*.vue',],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      // Vue.js 规则
      'vue/no-unused-vars': 'off', // Vue 组件中禁止存在未使用的变量
      'vue/require-default-prop': 'off', // 关闭要求 prop 默认值的规则
      'vue/multi-word-component-names': 'off', // 关闭组件名称必须为多词的规则
      'vue/html-self-closing': [
        'error',
        {
          html: {
            void: 'never', // void 元素不允许自闭合
            normal: 'never', // 普通元素要求自闭合
            component: 'never', // Vue 组件要求自闭合
          },
        },
      ],
    },
  },
  {
    files: ['**/*.{ts,tsx}',],
    rules: {
      // TypeScript 规则
      '@typescript-eslint/explicit-function-return-type': 'error', // 关闭显式函数返回类型的要求
      '@typescript-eslint/no-inferrable-types': 'error', // 允许使用可推断类型
      '@typescript-eslint/no-undef': 'off', // 禁用 @typescript-eslint/no-undef
      '@typescript-eslint/no-unused-vars': ['off',],   //非空允许
      '@typescript-eslint/no-unused-expressions': 'error',   //允许简洁写法，而不是非要使用if
      '@typescript-eslint/no-explicit-any': 'error',  //允许any
    },
  },

];

module.exports = {
  // 一行最多 500 字符
  printWidth: 500,
  // tab 健的空格数
  tabWidth: 2,
  // 不使用 tab 格式化
  useTabs: false,
  // 不加分号
  semi: true,
  // vue script和style标签中是否缩进,开启可能会破坏编辑器的代码折叠
  vueIndentScriptAndStyle: true,
  // 单引号
  singleQuote: true,
  //object对象中key值是否加引号
  quoteProps: 'as-needed',
  //object对象里面的key和value值和括号间的空格
  bracketSpacing: true,
  //尾部逗号设置，es5是尾部逗号兼容es5，none就是没有尾部逗号，all是指所有可能的情况，需要node8和es2017以上的环境
  trailingComma: 'none',
  //箭头函数单个参数的情况是否省略括号，默认always是总是带括号，avoid是单个参数不带括号
  arrowParens: 'always',
  //自当插入pragma到已经完成的format的文件开头
  insertPragma: false,
  //格式化有特定开头编译指示的文件 比如下面两种
  requirePragma: false,
  //文章换行,默认情况下会对你的markdown文件换行进行format会控制在printwidth以内
  proseWrap: 'never',
  // html中的空格敏感性
  htmlWhitespaceSensitivity: 'strict',
  //行尾换行符,默认是lf
  endOfLine: 'auto'
};

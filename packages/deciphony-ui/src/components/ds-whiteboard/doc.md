模式

1. 展示模式：

+ 元素不可以变形，但是可以点击

2. 编辑模式：

+ 不可以拖动
+ 元素不可以点击，但是可以变形
+ 可以添加、删除元素

被添加到白板的元素，会被包上一层壳，这个壳控制元素变形，移动，事件禁用

插槽：

+ 暴露右键插槽，自定义一个组件内跟随鼠标移动的弹窗

事件：

+ 右键点击事件，返回是在floatboard外还是floatboard后，触发时，鼠标是否在某个元素上，若是，把元素也返回

参数：

+ mode 模式 edit show
+ fixed 固定floatBoard boolean

暴露方法和属性：

+ cacheElement 将元素添加到缓存列表某个key下
+ addElement 把缓存列表的某个元素包上外壳添加到floatBoard上
+ delElement 删除缓存列表元素
+ exportJson 导出序列化的白板数据
+ importJson 引入序列化的白板数据


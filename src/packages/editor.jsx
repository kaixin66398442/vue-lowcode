import { defineComponent, computed, inject, ref, onMounted } from "vue";
import './editor.scss'
import EditorBlock from './editor-block'
import deepcopy from "deepcopy";
import useMenuDragger from './useMenuDragger'
import useFocus from "./useFocus";
import useBlockDragger from "./useBlockDragger";
// import useGridCanvas from "./useGridCanvas"
import { useCommand } from "./useCommand";
import { $dialog } from "@/components/Dialog";
import { $dropdown } from "@/components/Dropdown";
import { ElButton } from "element-plus";
import { DropdownItem } from '../components/Dropdown';
import EditorOperator from './editor-operator'
export default defineComponent({
    props: {
        modelValue: { type: Object },
        formData: { type: Object }
    },
    emits: ['update:modelValue'], // 要触发的事件；  // 和上面的modelValue都和v-model有关
    setup(props, ctx) { // ctx:context上下文
        // 预览的时候，内容不能操作了，可以点击，可以输入内容看效果
        const previewRef = ref(false) // 默认非预览状态
        const editorRef = ref(true) // 默认编辑状态

        const data = computed({
            get() {
                return props.modelValue
            },
            // 修改data时会调用
            set(newValue) {
                ctx.emit('update:modelValue', deepcopy(newValue)) // 要深拷贝，安装deepcopy包
            }
        })
        // console.log(data.value);
        const containerStyles = computed(() => ({
            width: data.value.container.width + 'px',
            height: data.value.container.height + 'px'
        }))
        const config = inject('config')
        console.log(config)

        // 初始化目标降落元素
        const containerRef = ref(null)
        // 初始化canvas画布元素
        const canvasRef = ref(null);

        // 1.实现菜单拖拽功能
        // 将dragstart和dragend函数封装
        const { dragstart, dragend } = useMenuDragger(containerRef, data)

        // 2.实现获取焦点,获取焦点后有可能直接拖拽，要在回调函数实现canvas中的组件的拖拽
        // 首先给组件绑定鼠标按下事件，并记录那些组件获取焦点状态(封装函数)
        const { blockMousedown, containerMousedown, focusData, lastSelectBlock, clearBlockFocus } = useFocus(data, previewRef, (e) => {
            // 获取选中的组件数组
            // console.log(focusData.value.focus);
            // 回调中执行组件拖拽
            mousedown(e)
        })

        // 在回调函数实现canvas中的组件的拖拽
        let { mousedown, markLine } = useBlockDragger(focusData, lastSelectBlock, data)

        // 命令集合
        const { commands } = useCommand(data, focusData)
        // editor-top中的按钮集合
        const buttons = [
            { label: '撤销', handler: () => { commands.undo() } },
            { label: '重做', handler: () => { commands.redo() } },
            {
                label: '导出',
                handler: () => {
                    $dialog({
                        title: '导出json使用',
                        content: JSON.stringify(data.value),
                        footer: false
                    })
                }
            },
            {
                label: '导入',
                handler: () => {
                    $dialog({
                        title: '导入json使用',
                        content: '',
                        footer: true,
                        onConfirm(text) {
                            // console.log(text);
                            // 用传过来的文本替换data
                            // data.value = JSON.parse(text) // 这样去修改无法保留历史记录
                            commands.updateContainer(JSON.parse(text))
                        }
                    })
                }
            },
            { label: '置顶', handler: () => { commands.placeTop() } },
            { label: '置底', handler: () => { commands.placeBottom() } },
            { label: '删除', handler: () => { commands.delete() } },
            {
                label: () => previewRef.value ? '编辑' : '预览', handler: () => {
                    previewRef.value = !previewRef.value
                    clearBlockFocus()
                }
            },
            {
                label: '关闭', handler: () => {
                    previewRef.value = true // 开启预览状态
                    editorRef.value = false // 关闭编辑状态
                    clearBlockFocus()
                }
            },
        ]

        // 右击组件块的回调
        const onContextMenuBlock = (e, block) => {
            e.preventDefault()
            $dropdown({
                el: e.target, // 以那个元素为准产生一个dropdown
                content: () => {
                    return <>
                        <DropdownItem label="删除" onClick={() => { commands.delete() }} ></DropdownItem >
                        <DropdownItem label="置顶" onClick={() => { commands.placeTop() }}></DropdownItem>
                        <DropdownItem label="置底" onClick={() => { commands.placeBottom() }}></DropdownItem>
                        <DropdownItem label="查看" onClick={() => {
                            $dialog({
                                title: '查看结点数据',
                                content: JSON.stringify(block)
                            })
                        }}></DropdownItem>
                        <DropdownItem label="导入" onClick={() => {
                            $dialog({
                                title: '导入结点数据',
                                content: '',
                                footer: true,
                                onConfirm(text) {
                                    text = JSON.parse(text)
                                    commands.updateBlock(text, block)
                                }
                            })
                        }}></DropdownItem>
                    </>
                }
            })
        }

        // 绘制网格背景画布的函数
        

        // onMounted(() => {
        //     useGridCanvas(canvasRef.value, data.value.container)
        // })

        return () => !editorRef.value ?
            // 关闭工作台状态
            <>
                <div style="float:right" onClick={() => { editorRef.value = true, previewRef.value = false }}><ElButton>继续编辑</ElButton></div>
                <div class="editor-container-canvas-content"
                    style={containerStyles.value}
                >
                    {
                        (data.value.blocks.map((block, index) => (
                            <EditorBlock
                                class={previewRef.value ? 'editor-block-preview' : ''}
                                block={block}
                                formData={props.formData}
                            ></EditorBlock>
                        )))
                    }
                </div>
                {JSON.stringify(props.formData)}
            </>
            // 开启工作台状态
            : <div class="editor" >
                <div class="editor-left">
                    {/* 根据注册列表渲染相应的内容 */}
                    {config.componentList.map(component => (
                        <div class="editor-left-item"
                            draggable
                            onDragstart={e => dragstart(e, component)}
                            // 拖拽结束要解绑事件
                            onDragend={dragend}
                        >
                            <span>{component.label}</span>
                            <div>{component.preview()}</div>
                        </div>
                    ))}
                </div>
                <div class="editor-top">
                    {buttons.map((btn, index) => {
                        const label = typeof btn.label == 'function' ? btn.label() : btn.label
                        return <button class="editor-top-btn" onClick={btn.handler}>
                            {label}
                        </button>
                    })}
                </div>
                <div class="editor-right">
                    <EditorOperator
                        block={lastSelectBlock.value}
                        data={data.value}
                        updateContainer={commands.updateContainer}
                        updateBlock={commands.updateBlock}
                    ></EditorOperator>
                </div>
                <div class="editor-container">
                    {/* 负责生成滚动条 */}
                    <div class="editor-container-canvas">
                        {/* 产生内容区域 */}
                        <div class="editor-container-canvas-content"
                            style={containerStyles.value}
                            ref={containerRef}
                            onMousedown={() => containerMousedown()}
                        >
                            {
                                (data.value.blocks.map((block, index) => (
                                    <EditorBlock
                                        class={block.focus ? 'editor-block-focus' : ''}
                                        class={previewRef.value ? 'editor-block-preview' : ''}
                                        block={block}
                                        onMousedown={(e) => blockMousedown(e, block, index)}
                                        onContextmenu={(e) => onContextMenuBlock(e, block)}
                                        formData={props.formData}
                                    ></EditorBlock>
                                )))
                            }
                            {/* 竖线 */}
                            {markLine.x !== null && <div className="line-x" style={{ left: markLine.x + 'px' }}></div>}
                            {/* 横线 */}
                            {markLine.y !== null && <div className="line-y" style={{ top: markLine.y + 'px' }}></div>}
                            <canvas ref={canvasRef}></canvas>
                        </div>
                    </div>
                </div>
            </div >
    }
})
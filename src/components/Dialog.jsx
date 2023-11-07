import { ElDialog, ElInput, ElButton } from "element-plus";
import { createVNode, defineComponent, reactive, render } from "vue";

const DialogComponent = defineComponent({
    props: {
        option: { type: Object }
    },
    setup(props, content) {
        const state = reactive({
            option: props.option,
            isShow: false
        })
        content.expose({
            showDialog(option) { // 让外界可以调用组件的方法
                state.option = option
                state.isShow = true
            }
        })
        const onCancel = () => {
            state.isShow = false
        }
        const onConfirm = () => {
            state.isShow = false
            state.option.onConfirm && state.option.onConfirm(state.option.content)
        }
        return () => {
            return <ElDialog v-model={state.isShow} title={state.option.title}>
                {{
                    default: () => <ElInput
                        type="textarea"
                        v-model={state.option.content}
                        rows={10}
                    ></ElInput>,
                    footer: () => state.option.footer && <div>
                        <ElButton onClick={onCancel}>取消</ElButton>
                        <ElButton type="primary" onClick={onConfirm}>确定</ElButton>
                    </div>
                }}
            </ElDialog>
        }
    }
})

let vnode;
export function $dialog(option) {
    // element-plus中带有el-dialog组件
    if (!vnode) { // 没有虚拟节点的话就要创建
        // 手动挂载组件 new SubComponent.$mount()
        let el = document.createElement('div')
        vnode = createVNode(DialogComponent, { option }) // 将组件渲染成虚拟节点
        render(vnode, el) // 渲染成真实结点
        document.body.appendChild(el) // 将元素扔到页面上
    }
    // 说明组件已经有了，直接显示就行
    let { showDialog } = vnode.component.exposed
    showDialog(option)
}
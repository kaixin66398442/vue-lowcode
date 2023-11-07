import { createVNode, defineComponent, reactive, ref, render, computed, onMounted, onBeforeMount,provide, inject } from "vue";


export const DropdownItem = defineComponent({
    props: {
        label: String
    },
    setup(props) {
        const hide = inject('hide')
        return () => <div class="dropdown-item" onClick={hide}>
            <span>{props.label}</span>
        </div>
    }
})


const DropdownComponent = defineComponent({
    props: {
        option: { type: Object }
    },
    setup(props, content) {
        const state = reactive({
            option: props.option,
            isShow: false,
            top: 0,
            left: 0
        })
        content.expose({
            showDropdown(option) { // 让外界可以调用组件的方法
                state.option = option
                state.isShow = true
                let { top, left, height } = option.el.getBoundingClientRect()
                state.top = top + height
                state.left = left
            }
        })

        provide('hide', () => state.isShow = false)

        const classes = computed(() => [
            'dropdown',
            {
                'dropdown-isShow': state.isShow
            }
        ])
        const styles = computed(() => ({
            top: state.top + 'px',
            left: state.left + 'px'
        }))
        const el = ref(null)
        const onMousedownDocument = (e) => {
            if (!el.value.contains(e.target)) {
                state.isShow = false
            }
        }
        onMounted(() => {
            // 搞成捕获
            document.body.addEventListener('mousedown', onMousedownDocument, true)
        })
        onBeforeMount(() => {
            document.body.removeEventListener('mousedown', onMousedownDocument, true)
        })
        return () => {
            return <div class={classes.value} style={styles.value} ref={el}>
                {state.option.content()}
            </div>
        }
    }
})

let vnode;
export function $dropdown(option) {
    // element-plus中带有el-dialog组件
    if (!vnode) { // 没有虚拟节点的话就要创建
        // 手动挂载组件 new SubComponent.$mount()
        let el = document.createElement('div')
        vnode = createVNode(DropdownComponent, { option }) // 将组件渲染成虚拟节点
        render(vnode, el) // 渲染成真实结点
        document.body.appendChild(el) // 将元素扔到页面上
    }
    // 说明组件已经有了，直接显示就行
    let { showDropdown } = vnode.component.exposed
    showDropdown(option)
}
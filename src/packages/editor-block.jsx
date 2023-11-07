import { defineComponent, computed, inject, onMounted, ref } from "vue";
import BlockResize from './block-resize'

export default defineComponent({
    props: {
        block: { type: Object },
        formData: { type: Object }
    },
    setup(props) {
        const blockStyles = computed(() => ({
            top: `${props.block.top}px`,
            left: `${props.block.left}px`,
            zIndex: `${props.block.zIndex}`
        }))
        const config = inject('config')

        // 初始化拖拽组件块
        // 获取组件块实例
        const blockRef = ref(null)
        onMounted(() => {
            // 获得拖拽组件块元素
            // console.log(blockRef.value);
            // 获取组件的宽高
            let { offsetWidth, offsetHeight } = blockRef.value
            if (props.block.alignCenter) { // 说明是拖拽松手的时候生成的，其他默认渲染到页面上的不需要居中
                props.block.left = props.block.left - offsetWidth / 2
                props.block.top = props.block.top - offsetHeight / 2 // 原则上重新派发事件 
                props.block.alignCenter = false // 放入convas后就变为拖拽不需要居中
            }
            props.block.width = offsetWidth
            props.block.height = offsetHeight
        })

        // console.log(config);
        return () => {
            // 根据传进来的key获得对应的组件
            const component = config.componentMap[props.block.key]
            // 获得渲染组件
            // console.log(props.block.props)
            const RenderComponent = component.render({
                size: props.block.hasResize ? { width: props.block.width, height: props.block.height } : {},
                props: props.block.props,
                model: Object.keys(component.model || {}).reduce((prev, modelName) => {
                    let propName = props.block.model[modelName] // 'username'
                    prev[modelName] = {
                        modelValue: props.formData[propName], // '张三'
                        "onUpdate:modelValue": v => props.formData[propName] = v
                    }
                    return prev
                }, {})
            })
            const { width, height } = component.resize || {}
            return <div class="editor-block" style={blockStyles.value} ref={blockRef}>
                {RenderComponent}
                {props.block.focus && (width || height) && <BlockResize
                    block={props.block}
                    component={component}
                ></BlockResize>}
            </div>
        }
    }
})
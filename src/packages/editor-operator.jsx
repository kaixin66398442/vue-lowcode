import deepcopy from "deepcopy";
import { ElForm, ElFormItem, ElButton, ElInputNumber, ElInput, ElColorPicker, ElSelect, ElOption } from "element-plus";
import { defineComponent, inject, reactive, watch } from "vue";
import TableEditor from "./table-editor.";
// import useGridCanvas from "./useGridCanvas"

export default defineComponent({
    props: {
        block: { type: Object }, // 最后选中的block
        data: { type: Object }, // 全部的数据
        updateContainer: { type: Function },
        updateBlock: { type: Function }
    },
    setup(props, ctx) {
        const config = inject('config') // 组件配置信息
        const state = reactive({
            editData: {}
        })
        const reset = () => {
            if (!props.block) { // 说明要绑定的是容器的宽高
                state.editData = deepcopy(props.data.container)
            } else {
                state.editData = deepcopy(props.block)
                // console.log(state.editData)
            }
        }
        const apply = () => {
            if (!props.block) { // 要修改的是容器的大小
                props.updateContainer({ ...props.data, container: state.editData })
                // 重新绘制背景网格
                // useGridCanvas()
            } else { // 要修改的组件的配置
                props.updateBlock(state.editData, props.block)
            }
        }
        watch(() => props.block, reset, { immediate: true })
        return () => {
            let content = []
            if (!props.block) {
                content.push(<>
                    <ElFormItem label="容器宽度">
                        <ElInputNumber v-model={state.editData.width}></ElInputNumber>
                    </ElFormItem>
                    <ElFormItem label="容器高度">
                        <ElInputNumber v-model={state.editData.height}></ElInputNumber>
                    </ElFormItem>
                </>)
            } else {
                let component = config.componentMap[props.block.key]
                // console.log(component.props) // {text: {…}, color: {…}, size: {…}}
                if (component && component.props) {
                    // console.log(Object.entries(component.props))
                    content.push(Object.entries(component.props).map(([propName, propConfig]) => {
                        // console.log(propConfig)
                        return <ElFormItem label={propConfig.label}>
                            {{
                                input: () => <ElInput v-model={state.editData.props[propName]}></ElInput>,
                                color: () => <ElColorPicker v-model={state.editData.props[propName]}></ElColorPicker>,
                                select: () => <ElSelect v-model={state.editData.props[propName]}>
                                    {propConfig.options.map(opt => {
                                        return <ElOption label={opt.label} value={opt.value}></ElOption>
                                    })}
                                </ElSelect>,
                                table: () => <TableEditor propConfig={propConfig} v-model={state.editData.props[propName]}></TableEditor>
                            }[propConfig.type]()}
                        </ElFormItem>
                    }))
                }
                if (component && component.model) {
                    content.push(Object.entries(component.model).map(([modelName, label]) => {
                        // console.log(modelName, label)
                        return <ElFormItem label={label}>
                            <ElInput v-model={state.editData.model[modelName]}></ElInput>
                        </ElFormItem>
                    }))
                }
            }

            return <ElForm labelPosition="top" style="padding:30px">
                {content}
                <ElFormItem>
                    <ElButton type="primary" onClick={() => apply()}>应用</ElButton>
                    <ElButton onClick={reset}>重置</ElButton>
                </ElFormItem>
            </ElForm>
        }
    }
})
// 列表区可以显示所有的物料
// key对应的组件映射关系
import { ElButton, ElInput, ElOption, ElSelect } from 'element-plus'
import Range from '../components/Range.jsx'

// 全部组件列表
const componentList = []
// 组件映射表
const componentMap = {}

// 注册组件的方法
const register = (component) => { // 注册
    componentList.push(component)
    componentMap[component.key] = component
}

// 创建属性对象的方法
const createInputProp = (label) => ({ type: 'input', label })
const createColorProp = (label) => ({ type: 'color', label })
const createSelectProp = (label, options) => ({ type: 'select', label, options })
const createTableProp = (label, table) => ({ type: 'table', label, table })

// 文本
register({
    label: '文本',
    preview: () => '预览文本',
    render: ({ props }) => <span style={{ color: props.color, fontSize: props.size }}>{props.text || '渲染文本'}</span>,
    key: 'text',
    props: {
        text: createInputProp('文本内容'),
        color: createColorProp('文本颜色'),
        size: createSelectProp('字体大小', [
            { label: '14px', value: '14px', },
            { label: '20px', value: '20px' },
            { label: '24px', value: '24px' },
        ])
    }
})

// 按钮
register({
    label: '按钮',
    resize: {
        width: true, // 控制可以改变宽度
        height: true // 控制可以改变高度
    },
    preview: () => <ElButton>预览按钮</ElButton>,
    render: ({ props, size }) => <ElButton type={props.type} size={props.size} style={{ width: size.width + 'px', height: size.height + 'px' }}>{props.text || '渲染按钮'}</ElButton>,
    key: 'button',
    props: {
        text: createInputProp('按钮内容'),
        type: createSelectProp('按钮类型', [
            { label: '基础', value: 'primary' },
            { label: '成功', value: 'success' },
            { label: '警告', value: 'warning' },
            { label: '危险', value: 'danger' },
            { label: '文本', value: 'text' },
        ]),
        size: createSelectProp('按钮尺寸', [
            { label: '默认', value: '' },
            { label: '中等', value: 'medium' },
            { label: '小', value: 'small' },
            { label: '极小', value: 'mini' },
        ])
    }
})

// 输入框
register({
    label: '输入框',
    resize: {
        width: true, // 控制可以改变宽度
    },
    preview: () => <ElInput placeholder="预览输入框"></ElInput>,
    render: ({ model, size }) => <ElInput style={{ width: size.width + 'px', height: size.height + 'px' }} placeholder="渲染输入框" {...model.default} ></ElInput>,
    key: 'input',
    model: {
        default: '绑定字段'
    }
})

// 范围选择器
register({
    label: '范围选择器',
    preview: () => <Range></Range>,
    render: ({ model }) => {
        return <Range {...{
            start: model.start.modelValue,
            end: model.end.modelValue,
            'onUpdate:start': model.start['onUpdate:modelValue'],
            'onUpdate:end': model.end['onUpdate:modelValue']
        }}></Range>
    },
    key: 'range',
    model: {
        start: '开始范围字段',
        end: '结束范围字段'
    }
})

// 下拉框
register({
    label: '下拉框',
    preview: () => <ElSelect modelValue=""></ElSelect>,
    render: ({ props, model }) => {
        return <ElSelect {...model.default}>
            {(props.options || []).map((opt, index) => {
                return <ElOption label={opt.label} value={opt.value} key={index}></ElOption>
            })}
        </ElSelect>
    },
    key: 'select',
    props: {
        options: createTableProp('下拉选项', {
            options: [   // 配置表格的选项
                { label: '显示值', field: 'label' },
                { label: '绑定值', field: 'value' },
            ],
            key: 'label' // 显示给用户的值，是label值
        })
    },
    model: {
        default: '绑定字段  '
    }
})

export let registerConfig = {
    componentList,
    componentMap
}
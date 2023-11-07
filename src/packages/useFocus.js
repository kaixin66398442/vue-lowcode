// 给组件绑定鼠标按下事件，并记录那些组件获取焦点状态
import { computed, ref } from 'vue'
export default function useFocus(data, previewRef, callback) {
    let selectIndex = ref(-1) // 表示没有任何一个被选中

    // 最后选择的那个组件
    let lastSelectBlock = computed(() => {
        return data.value.blocks[selectIndex.value]
    })

    // 计算哪些获取焦点哪些没有
    const focusData = computed(() => {
        let focus = []
        let unfocused = []
        data.value.blocks.forEach(block => (block.focus ? focus : unfocused).push(block))
        return { focus, unfocused }
    })

    const clearBlockFocus = () => { // 清除所有的focus的事件
        data.value.blocks.forEach(block => { block.focus = false })
    }

    const blockMousedown = (e, block, index) => {
        if (previewRef.value) {
            return
        }
        // 阻止默认事件，阻止冒泡
        e.preventDefault()
        e.stopPropagation()
        // block上规划一个属性focus，获取焦点后将它置为true
        if (e.shiftKey) { // 按下shift可以随意更改focus
            block.focus = !block.focus
        } else {
            if (!block.focus) {
                clearBlockFocus() // 要先清除其他人的focus属性
                block.focus = !block.focus
            }
        }
        selectIndex.value = index
        callback(e) 
    }

    // 点击容器，清除所有的focus
    const containerMousedown = () => {
        if (previewRef.value) {
            return
        }
        clearBlockFocus()
        // 点击空白处将selectIndex重新置为-1
        selectIndex.value = -1
    }
    return {
        blockMousedown,
        containerMousedown,
        focusData,
        lastSelectBlock,
        clearBlockFocus
    }
}
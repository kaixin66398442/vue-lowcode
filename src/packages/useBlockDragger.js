import { reactive } from "vue"
import { events } from "./events"

// 实现canvas中组件的拖拽
export default function useBlockDragger(focusData, lastSelectBlock, data) {
    let dragState = {
        startX: 0,
        startY: 0,
        dragging: false // 默认不是正在拖拽
    }
    let markLine = reactive({ // 标记线实现响应式 
        x: null,
        y: null
    })
    // 获取焦点后拖拽的回调
    const mousedown = (e) => {
        // 最后一个获得焦点的组件
        // console.log(lastSelectBlock.value);
        // 将拖拽的组件叫做B，被接近的组件叫做A
        const { width: BWidth, height: BHeight } = lastSelectBlock.value

        // 记录点击的位置
        dragState = {
            startX: e.clientX,
            startY: e.clientY,
            startLeft: lastSelectBlock.value.left, // B拖拽前的位置
            startTop: lastSelectBlock.value.top,
            startPos: focusData.value.focus.map(({ top, left }) => ({ top, left })),
            dragging: false,
            lines: (() => {
                const { unfocused } = focusData.value // 获得其他没有选中的以他们的位置做辅助线（A）
                let lines = { x: [], y: [] }; // 保存线，x保存竖线，y保存横线
                // console.log(unfocused);
                [...unfocused, {
                    left: 0,
                    top: 0,
                    width: data.value.container.width,
                    height: data.value.container.height
                }].forEach(block => {
                    const { left: ALeft, top: ATop, width: AWidth, height: AHeight } = block

                    // showTop为辅助线的位置，top为B到达该位置会出现辅助线
                    lines.y.push({ showTop: ATop, top: ATop }) // A顶对B顶
                    lines.y.push({ showTop: ATop, top: ATop - BHeight }) // A顶对B底
                    lines.y.push({ showTop: ATop + AHeight / 2, top: ATop + AHeight / 2 - BHeight / 2 }) // A中对B中
                    lines.y.push({ showTop: ATop + AHeight, top: ATop + AHeight }) // A底对B顶
                    lines.y.push({ showTop: ATop + AHeight, top: ATop + AHeight - BHeight }) // A底对B底

                    // showLeft为辅助线的位置，left为B到达该位置会出现辅助线
                    lines.x.push({ showLeft: ALeft, left: ALeft }) // A左对B左
                    lines.x.push({ showLeft: ALeft, left: ALeft - BWidth }) // A左对B右
                    lines.x.push({ showLeft: ALeft + AWidth / 2, left: ALeft + AWidth / 2 - BWidth / 2 }) // A中对B中
                    lines.x.push({ showLeft: ALeft + AWidth, left: ALeft + AWidth }) // A右对B左
                    lines.x.push({ showLeft: ALeft + AWidth, left: ALeft + AWidth - BWidth }) // A右对B右
                })
                console.log(lines);
                return lines
            })() // 自动执行函数
        }
        document.addEventListener('mousemove', mousemove)
        document.addEventListener('mouseup', mouseup)
    }
    const mousemove = (e) => {
        if (!dragState.dragging) {
            dragState.dragging = true
            events.emit('start') // 触发事件就会记住拖拽前的位置
        }

        // console.log(dragState.startPos);
        // 鼠标移动后的距离
        let { clientX: moveX, clientY: moveY } = e


        // 辅助线部分
        // 获取最新的left和top
        // 鼠标移动后 - 鼠标移动前 + 开始的left或top
        let left = moveX - dragState.startX + dragState.startLeft
        let top = moveY - dragState.startY + dragState.startTop

        // console.log(left, top);

        let y = null
        let x = null
        // 先计算横线，距离参照物元素还5像素的时候就显示这根线
        for (let i = 0; i < dragState.lines.y.length; i++) {
            const { top: t, showTop: s } = dragState.lines.y[i] // 获取每一条线
            if (Math.abs(t - top) < 5) {
                y = s // y保存线要出现的位置
                // 实现快速贴边
                // 最新的moveY 容器距离顶部的距离 + 目标的高度
                moveY = dragState.startY - dragState.startTop + t
                break // 找到一根线就跳出循环
            }

        }
        // 再计算竖线
        for (let i = 0; i < dragState.lines.x.length; i++) {
            const { left: l, showLeft: s } = dragState.lines.x[i] // 获取每一条线
            if (Math.abs(l - left) < 5) {
                x = s // x保存线要出现的位置
                // 最新的moveX
                moveX = dragState.startX - dragState.startLeft + l
                break // 找到一根线就跳出循环
            }
        }
        markLine.x = x // x,y是响应式数据，改变会引起视图的变化
        markLine.y = y
        // console.log(x, y);


        // 记录移动的距离
        let durX = moveX - dragState.startX
        let durY = moveY - dragState.startY
        // 移动
        focusData.value.focus.forEach((block, index) => {
            block.top = dragState.startPos[index].top + durY
            block.left = dragState.startPos[index].left + durX
        })
    }
    const mouseup = (e) => {
        if (dragState.dragging) {
            // dragState.dragging = false 不用也行
            events.emit('end')
        }

        document.removeEventListener('mousemove', mousemove)
        document.removeEventListener('mouseup', mouseup)
        markLine.x = null
        markLine.y = null
    }
    return {
        mousedown,
        markLine
    }
}
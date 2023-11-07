// 将dragstart和dragend函数封装

import { events } from "./events"

export default function useMenuDragger(containerRef, data) {
    // 初始化拖拽组件
    let currentComponent = null
    const dragenter = (e) => {
        // console.log('dragenter');
        e.dataTransfer.dropEffect = 'move'
    }
    const dragover = (e) => {
        // console.log('dragover');
        e.preventDefault()
    }
    const dragleave = (e) => {
        // console.log('dragleave');
        e.dataTransfer.dropEffect = 'none'
    }
    const drop = (e) => {
        // console.log('drop');

        // 内部已经渲染的组件
        let blocks = data.value.blocks
        // 重新渲染
        data.value = {
            ...data.value,
            blocks: [
                ...blocks,
                {
                    top: e.offsetY,
                    left: e.offsetX,
                    zIndex: 1,
                    key: currentComponent.key,
                    alignCenter: true, // 希望松手的时候可以居中
                    props: {}, // 初始属性配置信息
                    model: {} // 双向绑定
                }
            ]
        }
        // console.log(currentComponent);
        currentComponent = null // 置空
    }



    const dragstart = (e, component) => {
        // 要获取目标降落元素
        // console.log(containerRef.value);
        // 给目标元素绑定事件
        // dragenter 进入目标元素中，添加一个移动的标识
        // dragover 在目标元素经过，必须要阻止默认行为，否则不能触发drop
        // dragleave 离开目标元素时要增加一个禁用标识
        // drop松手时，根据拖拽的组件，添加一个组件
        containerRef.value.addEventListener('dragenter', dragenter)
        containerRef.value.addEventListener('dragover', dragover)
        containerRef.value.addEventListener('dragleave', dragleave)
        containerRef.value.addEventListener('drop', drop)
        // 保存拖拽组件
        currentComponent = component

        events.emit('start') // 发布start
    }

    const dragend = (e) => {
        containerRef.value.removeEventListener('dragenter', dragenter)
        containerRef.value.removeEventListener('dragover', dragover)
        containerRef.value.removeEventListener('dragleave', dragleave)
        containerRef.value.removeEventListener('drop', drop)

        events.emit('end') // 发布end
    }

    return {
        dragstart,
        dragend
    }
}

import { onUnmounted } from "vue"
import { events } from "./events"
import deepcopy from "deepcopy"

export function useCommand(data, focusData) {
    // 所有命令的状态
    const state = { // 前进后退需要指针
        current: -1, // 前进后退的索引值
        queue: [], // 存放所有的操作命令
        commands: {}, // 命令和执行函数的映射表 undo:()=>{} redo:()=>{}
        commandArray: [], // 存放所有命令
        destroyArray: [] // 销毁列表
    }

    // 注册命令函数
    const registry = (command) => {
        state.commandArray.push(command)
        state.commands[command.name] = (...args) => { // 命令名字对应执行函数
            const { redo, undo } = command.execute(...args)
            redo()
            if (!command.pushQueue) { // 不需要放入队列直接跳过
                return
            }
            let { queue, current } = state

            // 可能在放置的过程中有撤销操作，所以根据当前最新的
            if (queue.length > 0) {
                queue = queue.slice(0, current + 1)
                state.queue = queue
            }

            queue.push({ redo, undo }) // 保存指令的前进后退
            state.current = current + 1
            // console.log(state.queue);
        }
    }
    // 注册我们需要的函数
    // 重做
    registry({
        name: 'redo',
        keyboard: 'ctrl+y',
        execute() {
            return {
                redo() {
                    // console.log('重做');
                    let item = state.queue[state.current + 1] // 找到下一个还原
                    if (item) {
                        item.redo && item.redo()
                        state.current++
                    }
                }
            }
        }
    })
    // 撤销
    registry({
        name: 'undo',
        keyboard: 'ctrl+z',
        execute() {
            return {
                redo() {
                    // console.log('撤销');
                    if (state.current == -1) return // 没有可以撤销的就跳过
                    let item = state.queue[state.current] // 找到上一个还原
                    if (item) {
                        item.undo && item.undo()
                        state.current--
                    }
                }
            }
        }
    })
    // 拖拽
    registry({
        name: 'drag',
        pushQueue: true, // 表示等下属性要放入队列中
        init() { // 初始化操作默认执行
            this.before = null
            // 监控拖拽开始事件，保存状态
            const start = () => {
                this.before = deepcopy(data.value.blocks)
            }
            // 监控之后需要触发对应的指令
            const end = () => {
                state.commands.drag()
            }
            events.on('start', start)
            events.on('end', end)
            return () => {
                events.off('start')
                events.off('end')
            }
        },
        execute() { // state.commands.drag()
            let before = this.before // 之前的状态
            let after = data.value.blocks // 之后的状态
            return {
                redo() {
                    data.value = { ...data.value, blocks: after }
                },
                undo() {
                    data.value = { ...data.value, blocks: before }
                }
            }
        }
    });
    // 更新整个容器
    registry({
        name: 'updateContainer', // 更新整个容器
        pushQueue: true,
        execute(newValue) {
            let state = {
                before: data.value, // 之前的状态
                after: newValue // 之后的状态
            }

            return {
                redo() {
                    data.value = state.after
                },
                undo() {
                    data.value = state.before
                }
            }
        }
    })
    // 更新一个block
    registry({
        name: 'updateBlock', // 更新整个容器
        pushQueue: true,
        execute(newBlcok, oldBlock) {
            let state = {
                before: data.value.blocks,
                after: (() => {
                    let blocks = [...data.value.blocks] // 拷贝一份用于新的block
                    //在原来里面把老的找到
                    const index = data.value.blocks.indexOf(oldBlock)
                    if (index > -1) {
                        blocks.splice(index, 1, newBlcok)
                    }
                    return blocks
                })()
            }

            return {
                redo() {
                    data.value = { ...data.value, blocks: state.after }
                },
                undo() {
                    data.value = { ...data.value, blocks: state.before }
                }
            }
        }
    })
    // 置顶
    registry({
        name: 'placeTop',
        pushQueue: true,
        execute() {
            let before = deepcopy(data.value.blocks) // 先深拷贝一份
            let after = (() => { // 置顶就是在所有blocks中找到最大的
                let { focus, unfocused } = focusData.value
                let maxZIndex = unfocused.reduce((prev, block) => {
                    return Math.max(prev, block.zIndex)
                }, -Infinity)
                focus.forEach(block => block.zIndex = maxZIndex + 1) // 让当前选中的比最大的加一
                return data.value.blocks
            })()

            return {
                redo() { // 重做
                    data.value = { ...data.value, blocks: after }
                },
                undo() { // 撤销
                    // 如果当前blocks前后一致则不会更新
                    data.value = { ...data.value, blocks: before }
                }
            }
        }
    })
    // 置底
    registry({
        name: 'placeBottom',
        pushQueue: true,
        execute() {
            let before = deepcopy(data.value.blocks) // 先深拷贝一份
            let after = (() => {
                let { focus, unfocused } = focusData.value
                let minZIndex = unfocused.reduce((prev, block) => {
                    return Math.min(prev, block.zIndex)
                }, Infinity) - 1
                // 不能直接减一，因为index不能出现负值
                if (minZIndex < 0) {
                    const dur = Math.abs(minZIndex)
                    minZIndex = 0
                    unfocused.forEach(block => block.zIndex += dur) // 让没选中的上升，自己为0
                }
                focus.forEach(block => block.zIndex = minZIndex)
                return data.value.blocks
            })()

            return {
                redo() { // 重做
                    data.value = { ...data.value, blocks: after }
                },
                undo() { // 撤销
                    // 如果当前blocks前后一致则不会更新
                    data.value = { ...data.value, blocks: before }
                }
            }
        }
    })
    // 删除
    registry({
        name: 'delete',
        pushQueue: true,
        execute() {
            let before = deepcopy(data.value.blocks) // 先深拷贝一份
            let after = focusData.value.unfocused // 选中的都是删除的，留下的都是未选中的

            return {
                redo() { // 重做
                    data.value = { ...data.value, blocks: after }
                },
                undo() { // 撤销
                    // 如果当前blocks前后一致则不会更新
                    data.value = { ...data.value, blocks: before }
                }
            }
        }
    })


    const keyboardEvent = (() => {
        const keyCodes = {
            90: 'z',
            89: 'y'
        }
        const onkeydown = (e) => {
            const { ctrlKey, keyCode } = e
            let keyString = []
            if (ctrlKey) keyString.push('ctrl')
            keyString.push(keyCodes[keyCode])
            keyString = keyString.join('+')
            // console.log(keyString);

            state.commandArray.forEach(({ name, keyboard }) => {
                if (!keyboard) return // 没有键盘事件，例如'drag'
                if (keyboard === keyString) {
                    state.commands[name]()
                    e.preventDefault();
                }
            })
        }
        const init = () => { // 初始化事件
            window.addEventListener('keydown', onkeydown)
            return () => { // 销毁事件
                window.removeEventListener('keydown', onkeydown)
            }
        }
        return init
    })();

    //  自动执行函数
    (() => {

        // 执行所有的命令
        state.commandArray.forEach(command => { command.init && state.destroyArray.push(command.init()) })
        state.destroyArray.push(keyboardEvent())
        // 执行结束后要销毁
    })()

    onUnmounted(() => {
        state.destroyArray.forEach(fn => fn && fn())
    }) // 拖拽结束后该销毁的全销毁

    return state
}
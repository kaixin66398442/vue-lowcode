// 给组件设置网格背景的函数
export default function useGridCanvas(canvas, containerStyles) {
    const context = canvas.getContext('2d');

    console.log(containerStyles.width)
    // 设置画布的宽度和高度
    canvas.width = containerStyles.width; // 你可以根据需要调整宽度
    canvas.height = containerStyles.height; // 你可以根据需要调整高度

    // 绘制网格背景
    const gridSize = containerStyles.width / 20; // 网格大小
    context.strokeStyle = '#ccc'; // 网格线的颜色

    for (let x = 0; x < canvas.width; x += gridSize) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height);
        context.stroke();
    }

    for (let y = 0; y < canvas.height; y += gridSize) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(canvas.width, y);
        context.stroke();
    }
}
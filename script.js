// 游戏状态变量
let currentTarget = 1; // 当前需要点击的数字（从1开始）
let startTime = null; // 开始时间戳（null表示未开始）
let timerId = null; // 计时器ID（用于停止计时）

// DOM元素获取
const gridItems = Array.from(document.querySelectorAll('.grid-item')); // 所有格子（转换为数组）
const startBtn = document.getElementById('start-btn'); // 开始按钮
const timerElement = document.getElementById('timer'); // 计时显示
const resultElement = document.getElementById('result'); // 结果提示框
const durationElement = document.getElementById('duration'); // 时长显示
const levelElement = document.getElementById('level'); // 等级显示
const leaderboardElement = document.getElementById('leaderboard'); // 排行榜列表

// 初始化排行榜（从localStorage获取，无数据则为空数组）
let leaderboard = JSON.parse(localStorage.getItem('schulteLeaderboard')) || [];

// 初始化函数（页面加载时执行）
function init() {
    renderLeaderboard(); // 渲染排行榜
    startBtn.addEventListener('click', startGame); // 绑定开始游戏事件
}

// 生成1-25的随机排列数组（Fisher-Yates洗牌算法，确保随机性）
function generateRandomNumbers() {
    const numbers = Array.from({ length: 25 }, (_, i) => i + 1); // 生成1-25的数组
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); // 生成0到i的随机索引
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]]; // 交换元素（洗牌）
    }
    return numbers;
}

// 初始化格子（设置随机数字和点击事件）
function initGridItems() {
    const randomNumbers = generateRandomNumbers(); // 生成随机数字数组
    gridItems.forEach((item, index) => {
        item.dataset.number = randomNumbers[index]; // 将数字存储在data属性中（用于点击验证）
        item.classList.remove('clicked', 'error'); // 重置样式（移除已点击/错误类）
        item.removeEventListener('click', handleGridClick); // 移除现有点击事件（防止重复绑定）
        item.addEventListener('click', handleGridClick); // 绑定新的点击事件
    });
}

// 开始游戏函数
function startGame() {
    // 重置状态
    currentTarget = 1;
    startTime = null;
    clearInterval(timerId); // 停止现有计时器
    timerElement.textContent = '00:00.000'; // 重置计时显示
    resultElement.classList.add('hidden'); // 隐藏结果提示
    startBtn.disabled = true; // 禁用开始按钮（防止重复点击）

    // 重新初始化格子（生成新的随机数字）
    initGridItems();

    // 延迟0.5秒启动计时器（给用户准备时间）
    setTimeout(() => {
        startTime = Date.now(); // 记录开始时间
        timerId = setInterval(updateTimer, 100); // 每100ms更新一次计时（提升流畅度）
    }, 500);
}

// 更新计时显示函数
function updateTimer() {
    if (!startTime) return; // 未开始则返回
    const elapsed = Date.now() - startTime; // 计算已过去的毫秒数
    timerElement.textContent = formatTime(elapsed); // 格式化时间并显示
}

// 将毫秒转换为「mm:ss.sss」格式函数
function formatTime(ms) {
    const minutes = Math.floor(ms / 60000); // 分钟（1分钟=60000毫秒）
    const seconds = Math.floor((ms % 60000) / 1000); // 秒（取模后除以1000）
    const milliseconds = ms % 1000; // 毫秒（取模1000）
    // 补零处理（确保两位数/三位数）
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}

// 格子点击事件处理函数
function handleGridClick(e) {
    const item = e.target; // 点击的格子元素
    const number = parseInt(item.dataset.number); // 获取格子的数字（从data属性中取）

    // 验证条件：游戏未开始/格子已点击/点击错误
    if (!startTime || item.classList.contains('clicked')) return; // 未开始或已点击则忽略

    // 验证是否点击了正确的数字
    if (number === currentTarget) {
        item.classList.add('clicked'); // 添加「已点击」样式（绿色）
        currentTarget++; // 目标数字加1（下一个需要点击的数字）

        // 检查游戏是否结束（点击到25）
        if (currentTarget > 25) {
            endGame(); // 结束游戏
        }
    } else {
        // 点击错误：添加「错误」样式（红色），0.5秒后移除
        item.classList.add('error');
        setTimeout(() => item.classList.remove('error'), 500);
    }
}

// 获取等级评价函数
function getLevel(duration) {
    const seconds = duration / 1000; // 将毫秒转换为秒

    if (seconds < 10) return { level: "优秀", description: "视觉搜索速度快，注意力高度集中" };
    if (seconds < 15) return { level: "良好", description: "专注力较好，能快速切换目标" };
    if (seconds < 25) return { level: "中等", description: "正常范围，适合日常工作/学习需求" };
    if (seconds < 35) return { level: "及格", description: "注意力略有分散，需加强训练" };
    return { level: "不合格", description: "注意力持续时间短，易分心，可能需要专业干预" };
}

// 结束游戏函数
function endGame() {
    clearInterval(timerId); // 停止计时器
    const endTime = Date.now(); // 结束时间戳
    const duration = endTime - startTime; // 总时长（毫秒）
    const formattedDuration = formatTime(duration); // 格式化时长（mm:ss.sss）

    // 获取等级评价
    const levelInfo = getLevel(duration);

    // 显示结果
    resultElement.classList.remove('hidden'); // 显示结果提示框
    durationElement.textContent = formattedDuration; // 显示时长
    levelElement.textContent = `${levelInfo.level} (${levelInfo.description})`; // 显示等级和描述

    // 更新排行榜
    updateLeaderboard(duration);

    // 启用开始按钮（允许重新开始）
    startBtn.disabled = false;
}

// 更新排行榜函数
function updateLeaderboard(duration) {
    // 添加新成绩（time：时间戳，用于区分相同时长；duration：时长，用于排序）
    leaderboard.push({
        time: Date.now(),
        duration: duration
    });

    // 按时长升序排序（时间越短排名越前）
    leaderboard.sort((a, b) => a.duration - b.duration);

    // 保留前5名（防止排行榜过长）
    leaderboard = leaderboard.slice(0, 5);

    // 将排行榜存储到localStorage（持久化，刷新页面不丢失）
    localStorage.setItem('schulteLeaderboard', JSON.stringify(leaderboard));

    // 重新渲染排行榜（更新显示）
    renderLeaderboard();
}

// 渲染排行榜函数
function renderLeaderboard() {
    // 清空现有排行榜内容
    leaderboardElement.innerHTML = '';

    // 生成排行榜条目
    leaderboard.forEach((entry, index) => {
        const li = document.createElement('li'); // 创建列表项
        const rank = index + 1; // 排名（从1开始）
        const formattedDuration = formatTime(entry.duration); // 格式化时长
        const levelInfo = getLevel(entry.duration); // 获取等级信息

        li.innerHTML = `
      <span class="rank">第${rank}名</span>
      <span class="time">${formattedDuration}</span>
      <span class="level">${levelInfo.level}</span>
    `; // 排名、时长和等级显示
        leaderboardElement.appendChild(li); // 添加到排行榜列表
    });

    // 如果没有成绩，显示提示信息
    if (leaderboard.length === 0) {
        const li = document.createElement('li');
        li.textContent = '暂无成绩，快来挑战吧！';
        leaderboardElement.appendChild(li);
    }
}

// 初始化游戏（页面加载时执行）
init();
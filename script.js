// 游戏状态变量
let currentTarget = 1;
let startTime = null;
let timerId = null;

// DOM元素获取
const gridItems = Array.from(document.querySelectorAll('.grid-item'));
const startBtn = document.getElementById('start-btn');
const rulesBtn = document.getElementById('rules-btn');
const restartBtn = document.getElementById('restart-btn');
const timerElement = document.getElementById('timer');
const resultElement = document.getElementById('result');
const durationElement = document.getElementById('duration');
const levelElement = document.getElementById('level');
const leaderboardElement = document.getElementById('leaderboard');
const rulesModal = document.getElementById('rules-modal');
const closeModal = document.querySelector('.close');
const startFromRules = document.getElementById('start-from-rules');

// 初始化排行榜
let leaderboard = JSON.parse(localStorage.getItem('schulteLeaderboard')) || [];

// 初始化函数
function init() {
    renderLeaderboard();
    startBtn.addEventListener('click', startGame);
    rulesBtn.addEventListener('click', showRules);
    restartBtn.addEventListener('click', startGame);
    closeModal.addEventListener('click', hideRules);
    startFromRules.addEventListener('click', startFromRulesHandler);

    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === rulesModal) {
            hideRules();
        }
    });

    // 页面加载时显示规则
    setTimeout(showRules, 500);
}

// 显示游戏规则
function showRules() {
    rulesModal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // 防止背景滚动
}

// 隐藏游戏规则
function hideRules() {
    rulesModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// 从规则弹窗开始游戏
function startFromRulesHandler() {
    hideRules();
    startGame();
}

// 生成随机数字
function generateRandomNumbers() {
    const numbers = Array.from({ length: 25 }, (_, i) => i + 1);
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    return numbers;
}

// 初始化格子
function initGridItems() {
    const randomNumbers = generateRandomNumbers();
    gridItems.forEach((item, index) => {
        item.dataset.number = randomNumbers[index];
        item.classList.remove('clicked', 'error');
        item.removeEventListener('click', handleGridClick);
        item.addEventListener('click', handleGridClick);
    });
}

// 开始游戏
function startGame() {
    // 重置状态
    currentTarget = 1;
    startTime = null;
    clearInterval(timerId);
    timerElement.textContent = '00:00.000';
    resultElement.classList.add('hidden');
    startBtn.disabled = true;
    rulesBtn.disabled = true;

    // 初始化格子
    initGridItems();

    // 添加开始动画
    gridItems.forEach((item, index) => {
        setTimeout(() => {
            item.style.animation = 'pulse 0.5s ease-in-out';
            setTimeout(() => item.style.animation = '', 500);
        }, index * 50);
    });

    // 延迟启动计时器
    setTimeout(() => {
        startTime = Date.now();
        timerId = setInterval(updateTimer, 100);
    }, 1000);
}

// 更新计时器
function updateTimer() {
    if (!startTime) return;
    const elapsed = Date.now() - startTime;
    timerElement.textContent = formatTime(elapsed);
}

// 格式化时间
function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}

// 处理格子点击
function handleGridClick(e) {
    const item = e.target;
    const number = parseInt(item.dataset.number);

    if (!startTime || item.classList.contains('clicked')) return;

    if (number === currentTarget) {
        item.classList.add('clicked');
        currentTarget++;

        // 添加点击反馈
        item.style.animation = 'pulse 0.3s ease-in-out';
        setTimeout(() => item.style.animation = '', 300);

        if (currentTarget > 25) {
            endGame();
        }
    } else {
        item.classList.add('error');
        setTimeout(() => item.classList.remove('error'), 500);
    }
}

// 获取等级评价
function getLevel(duration) {
    const seconds = duration / 1000;

    if (seconds < 10) return {
        level: "优秀",
        description: "视觉搜索速度快，注意力高度集中",
        className: "level-excellent"
    };
    if (seconds < 15) return {
        level: "良好",
        description: "专注力较好，能快速切换目标",
        className: "level-good"
    };
    if (seconds < 25) return {
        level: "中等",
        description: "正常范围，适合日常工作/学习需求",
        className: "level-medium"
    };
    if (seconds < 35) return {
        level: "及格",
        description: "注意力略有分散，需加强训练",
        className: "level-pass"
    };
    return {
        level: "不合格",
        description: "注意力持续时间短，易分心，可能需要专业干预",
        className: "level-fail"
    };
}

// 结束游戏
function endGame() {
    clearInterval(timerId);
    const endTime = Date.now();
    const duration = endTime - startTime;
    const formattedDuration = formatTime(duration);
    const levelInfo = getLevel(duration);

    // 显示结果
    resultElement.classList.remove('hidden');
    durationElement.textContent = formattedDuration;
    levelElement.textContent = `${levelInfo.level} - ${levelInfo.description}`;
    levelElement.className = levelInfo.className;

    // 添加庆祝动画
    resultElement.style.animation = 'celebrate 1s ease-in-out';
    setTimeout(() => resultElement.style.animation = '', 1000);

    // 更新排行榜
    updateLeaderboard(duration);

    // 启用按钮
    startBtn.disabled = false;
    rulesBtn.disabled = false;
}

// 更新排行榜
function updateLeaderboard(duration) {
    leaderboard.push({
        time: Date.now(),
        duration: duration
    });

    leaderboard.sort((a, b) => a.duration - b.duration);
    leaderboard = leaderboard.slice(0, 5);
    localStorage.setItem('schulteLeaderboard', JSON.stringify(leaderboard));
    renderLeaderboard();
}

// 渲染排行榜
function renderLeaderboard() {
    leaderboardElement.innerHTML = '';

    leaderboard.forEach((entry, index) => {
        const li = document.createElement('li');
        const rank = index + 1;
        const formattedDuration = formatTime(entry.duration);
        const levelInfo = getLevel(entry.duration);

        li.innerHTML = `
            <span class="rank">第${rank}名</span>
            <span class="time">${formattedDuration}</span>
            <span class="${levelInfo.className}">${levelInfo.level}</span>
        `;
        leaderboardElement.appendChild(li);
    });

    if (leaderboard.length === 0) {
        const li = document.createElement('li');
        li.textContent = '暂无成绩，快来挑战吧！';
        li.style.justifyContent = 'center';
        leaderboardElement.appendChild(li);
    }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
    
    @keyframes celebrate {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
`;
document.head.appendChild(style);

// 初始化游戏
init();

/**
 * 数独游戏工具函数
 */

// 工具类
class SudokuUtils {
    // 格式化时间显示
    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // 生成随机整数
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // 洗牌算法
    static shuffle(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    // 深拷贝数组
    static deepCopy(array) {
        return array.map(row => [...row]);
    }

    // 检查数组是否相等
    static arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i].length !== b[i].length) return false;
            for (let j = 0; j < a[i].length; j++) {
                if (a[i][j] !== b[i][j]) return false;
            }
        }
        return true;
    }

    // 获取数独区块起始位置
    static getBlockStart(row, col) {
        return {
            startRow: Math.floor(row / 3) * 3,
            startCol: Math.floor(col / 3) * 3
        };
    }

    // 获取数独区块内的所有格子
    static getBlockCells(row, col) {
        const { startRow, startCol } = this.getBlockStart(row, col);
        const cells = [];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                cells.push({ row: startRow + i, col: startCol + j });
            }
        }
        return cells;
    }

    // 检查坐标是否在有效范围内
    static isValidPosition(row, col) {
        return row >= 0 && row < 9 && col >= 0 && col < 9;
    }

    // 将一维索引转换为二维坐标
    static indexToPosition(index) {
        return {
            row: Math.floor(index / 9),
            col: index % 9
        };
    }

    // 将二维坐标转换为一维索引
    static positionToIndex(row, col) {
        return row * 9 + col;
    }

    // 生成唯一的游戏ID
    static generateGameId() {
        return `sudoku_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 防抖函数
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 节流函数
    static throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // 计算完成率
    static calculateCompletionRate(board, solution) {
        let filled = 0;
        let total = 0;
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j] !== 0) {
                    filled++;
                    if (board[i][j] === solution[i][j]) {
                        total++;
                    }
                }
            }
        }
        return Math.round((total / 81) * 100);
    }

    // 检查是否完成游戏
    static isGameComplete(board, solution) {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j] !== solution[i][j]) {
                    return false;
                }
            }
        }
        return true;
    }

    // 获取空格子的数量
    static getEmptyCells(board) {
        const emptyCells = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j] === 0) {
                    emptyCells.push({ row: i, col: j });
                }
            }
        }
        return emptyCells;
    }

    // 计算游戏难度（基于空格数量）
    static calculateDifficulty(emptyCells) {
        if (emptyCells <= 30) return 'easy';
        if (emptyCells <= 45) return 'medium';
        return 'hard';
    }

    // 获取当前时间戳
    static getTimestamp() {
        return new Date().toISOString();
    }

    // 解析时间戳
    static parseTimestamp(timestamp) {
        return new Date(timestamp);
    }

    // 格式化日期显示
    static formatDate(date) {
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // 显示消息
    static showMessage(message, type = 'info', duration = 3000) {
        const messageElement = document.getElementById('game-message');
        if (!messageElement) return;

        messageElement.textContent = message;
        messageElement.className = `game-message ${type} show`;

        setTimeout(() => {
            messageElement.classList.remove('show');
        }, duration);
    }

    // 确认对话框
    static confirm(message, callback) {
        const result = confirm(message);
        if (callback) callback(result);
        return result;
    }

    // 本地存储工具
    static storage = {
        // 保存数据到本地存储
        save(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (error) {
                console.error('保存到本地存储失败:', error);
                return false;
            }
        },

        // 从本地存储读取数据
        load(key, defaultValue = null) {
            try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : defaultValue;
            } catch (error) {
                console.error('从本地存储读取失败:', error);
                return defaultValue;
            }
        },

        // 删除本地存储数据
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('删除本地存储数据失败:', error);
                return false;
            }
        },

        // 清空本地存储
        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.error('清空本地存储失败:', error);
                return false;
            }
        }
    };

    // 键盘事件处理
    static keyboard = {
        // 处理数字键输入
        handleNumberInput(event, callback) {
            const key = event.key;
            if (key >= '1' && key <= '9') {
                callback(parseInt(key));
            } else if (key === '0' || key === 'Delete' || key === 'Backspace') {
                callback(0);
            }
        },

        // 处理方向键导航
        handleArrowKeys(event, currentRow, currentCol, callback) {
            let newRow = currentRow;
            let newCol = currentCol;

            switch (event.key) {
                case 'ArrowUp':
                    newRow = Math.max(0, currentRow - 1);
                    break;
                case 'ArrowDown':
                    newRow = Math.min(8, currentRow + 1);
                    break;
                case 'ArrowLeft':
                    newCol = Math.max(0, currentCol - 1);
                    break;
                case 'ArrowRight':
                    newCol = Math.min(8, currentCol + 1);
                    break;
                default:
                    return;
            }

            if (newRow !== currentRow || newCol !== currentCol) {
                event.preventDefault();
                callback(newRow, newCol);
            }
        }
    };
}

// 导出工具类
window.SudokuUtils = SudokuUtils;
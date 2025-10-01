/**
 * 数独游戏主逻辑
 */

class SudokuGame {
    constructor() {
        // 游戏状态
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.initialBoard = Array(9).fill().map(() => Array(9).fill(0));
        this.selectedCell = null;
        this.difficulty = 'medium';

        // 游戏统计
        this.gameTime = 0;
        this.gameTimer = null;
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.gameHistory = [];
        this.redoStack = [];

        // 游戏状态
        this.isGameComplete = false;
        this.isGameStarted = false;
        this.gameId = null;

        // 笔记功能
        this.notes = {};                // 存储所有单元格的笔记 { "row,col": [1,2,3] }
        this.notesMode = false;         // 是否处于笔记模式
        this.notesHistory = [];         // 笔记操作历史
        this.notesRedoStack = [];       // 笔记重做栈

        // 初始化游戏
        this.init();
    }

    init() {
        this.loadGameData();
        this.createBoard();
        this.bindEvents();
        this.loadSettings();
        this.startNewGame();
        this.loadHistory();
    }

    // 加载游戏数据
    loadGameData() {
        // 加载保存的游戏状态
        const savedGame = SudokuUtils.storage.load('sudoku_current_game');
        if (savedGame) {
            this.loadGameState(savedGame);
        }

        // 加载统计数据
        this.loadStatistics();
    }

    // 创建游戏棋盘
    createBoard() {
        const boardElement = document.getElementById('sudoku-board');
        boardElement.innerHTML = '';

        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.dataset.index = i * 9 + j;
                cell.addEventListener('click', () => this.selectCell(i, j));
                cell.addEventListener('contextmenu', (e) => this.handleCellRightClick(i, j, e));

                // 创建笔记容器
                const notesContainer = document.createElement('div');
                notesContainer.className = 'notes-container';
                notesContainer.innerHTML = this.createNotesGrid();
                cell.appendChild(notesContainer);

                boardElement.appendChild(cell);
            }
        }
    }

    // 绑定事件
    bindEvents() {
        // 控制按钮事件
        document.getElementById('new-game-btn').addEventListener('click', () => this.startNewGame());
        document.getElementById('hint-btn').addEventListener('click', () => this.giveHint());
        document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        document.getElementById('redo-btn').addEventListener('click', () => this.redo());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());

        // 难度选择事件
        document.getElementById('difficulty-select').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.startNewGame();
        });

        // 数字按钮事件
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const number = parseInt(btn.dataset.number);
                if (this.notesMode && this.selectedCell) {
                    // 笔记模式下，使用笔记功能
                    this.toggleNoteNumber(number);
                } else {
                    // 正常模式下，输入数字
                    this.inputNumber(number);
                }
            });
        });

        // 历史记录事件
        document.getElementById('toggle-history').addEventListener('click', () => {
            this.toggleHistory();
        });

        document.getElementById('clear-history').addEventListener('click', () => {
            this.clearHistory();
        });

        document.getElementById('export-history').addEventListener('click', () => {
            this.exportHistory();
        });

        // 笔记功能事件
        document.getElementById('notes-mode-toggle').addEventListener('change', (e) => {
            this.toggleNotesMode(e.target.checked);
        });

        document.getElementById('clear-notes-btn').addEventListener('click', () => {
            this.clearAllNotes();
        });

        document.getElementById('auto-notes-btn').addEventListener('click', () => {
            this.autoFillNotes();
        });

        // 笔记数字选择器事件
        document.querySelectorAll('.notes-number-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const number = parseInt(btn.dataset.number);
                this.toggleNoteNumber(number);
            });
        });

        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // 防止页面失去焦点时的问题
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveGameState();
            } else {
                this.loadStatistics();
            }
        });
    }

    // 开始新游戏
    startNewGame() {
        // 停止当前游戏计时器
        this.stopTimer();

        // 重置游戏状态
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.initialBoard = Array(9).fill().map(() => Array(9).fill(0));
        this.selectedCell = null;
        this.gameTime = 0; // 重置游戏时间
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.gameHistory = [];
        this.redoStack = [];
        this.isGameComplete = false;
        this.isGameStarted = false;

        // 重置笔记相关状态
        this.notes = {};                // 清空所有笔记
        this.notesMode = false;         // 关闭笔记模式
        this.notesHistory = [];         // 清空笔记历史
        this.notesRedoStack = [];       // 清空笔记重做栈

        // 生成新的数独谜题
        this.generatePuzzle();

        // 更新显示
        this.updateBoard();
        this.updateStats();
        this.updateButtons();
        this.updateAllCellsNotes();     // 清除所有笔记显示
        this.updateNotesControls();     // 更新笔记控制按钮状态

        // 生成新的游戏ID
        this.gameId = SudokuUtils.generateGameId();

        // 显示消息
        SudokuUtils.showMessage('新游戏开始！祝你好运！', 'info');

        // 保存游戏状态
        this.saveGameState();
    }

    // 生成数独谜题
    generatePuzzle() {
        try {
            // 完全使用动态生成，不再依赖预设题目
            const puzzle = SudokuGenerator.generatePuzzle(this.difficulty);
            this.board = SudokuUtils.deepCopy(puzzle.puzzle);
            this.solution = SudokuUtils.deepCopy(puzzle.solution);
            this.initialBoard = SudokuUtils.deepCopy(puzzle.puzzle);
            
            // 记录生成的谜题信息
            console.log(`成功生成${this.difficulty}难度数独，移除了${puzzle.cellsRemoved}个格子`);
        } catch (error) {
            console.error('动态生成数独失败:', error);
            // 如果动态生成失败，使用备用的简单谜题
            this.board = [
                [5,3,0,0,7,0,0,0,0],
                [6,0,0,1,9,5,0,0,0],
                [0,9,8,0,0,0,0,6,0],
                [8,0,0,0,6,0,0,0,3],
                [4,0,0,8,0,3,0,0,1],
                [7,0,0,0,2,0,0,0,6],
                [0,6,0,0,0,0,2,8,0],
                [0,0,0,4,1,9,0,0,5],
                [0,0,0,0,8,0,0,7,9]
            ];
            this.solution = [
                [5,3,4,6,7,8,9,1,2],
                [6,7,2,1,9,5,3,4,8],
                [1,9,8,3,4,2,5,6,7],
                [8,5,9,7,6,1,4,2,3],
                [4,2,6,8,5,3,7,9,1],
                [7,1,3,9,2,4,8,5,6],
                [9,6,1,5,3,7,2,8,4],
                [2,8,7,4,1,9,6,3,5],
                [3,4,5,2,8,6,1,7,9]
            ];
            this.initialBoard = SudokuUtils.deepCopy(this.board);
            console.warn('使用备用谜题');
        }
    }



    // 选择格子
    selectCell(row, col) {
        // 如果游戏已完成，不允许选择
        if (this.isGameComplete) return;

        // 如果是固定数字，不允许选择
        if (this.initialBoard[row][col] !== 0) return;

        // 开始游戏计时
        if (!this.isGameStarted) {
            this.startTimer();
            this.isGameStarted = true;
        }

        // 更新选中的格子
        this.selectedCell = { row, col };
        this.updateBoard();
        this.highlightRelatedCells(row, col);
        this.updateNotesControls();
    }

    // 高亮相关格子
    highlightRelatedCells(row, col) {
        const cells = document.querySelectorAll('.sudoku-cell');

        cells.forEach(cell => {
            const cellRow = parseInt(cell.dataset.row);
            const cellCol = parseInt(cell.dataset.col);
            const value = this.board[row][col];

            // 移除所有高亮
            cell.classList.remove('same-value');

            // 高亮相同值的格子
            if (value !== 0 && this.board[cellRow][cellCol] === value) {
                cell.classList.add('same-value');
            }
        });
    }

    // 输入数字
    inputNumber(number) {
        if (!this.selectedCell || this.isGameComplete) return;

        const { row, col } = this.selectedCell;

        // 如果是固定数字，不允许修改
        if (this.initialBoard[row][col] !== 0) return;

        // 记录历史状态
        this.saveGameHistoryState();

        // 清除重做栈
        this.redoStack = [];

        // 输入数字
        if (number === 0) {
            this.board[row][col] = 0;
        } else {
            // 检查是否有效
            if (SudokuValidator.isValidMove(this.board, row, col, number)) {
                this.board[row][col] = number;
                this.movesCount++;

                // 检查游戏是否完成
                this.checkGameComplete();
            } else {
                // 显示错误提示
                this.showError(row, col);
                return;
            }
        }

        // 更新显示
        this.updateBoard();
        this.updateStats();
        this.updateButtons();

        // 清除该单元格的笔记（当输入有效数字时）
        if (number !== 0) {
            const key = `${row},${col}`;
            if (this.notes[key]) {
                this.saveNotesState();
                delete this.notes[key];
                this.updateNotesControls();
            }
        }

        // 保存游戏状态
        this.saveGameState();
    }

    // 显示错误
    showError(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('error');
        setTimeout(() => {
            cell.classList.remove('error');
        }, 1000);

        SudokuUtils.showMessage('这个数字在这里不合法！', 'error');
    }

    // 撤销操作
    undo() {
        if (this.gameHistory.length === 0) return;

        // 保存当前状态到重做栈
        this.redoStack.push({
            board: SudokuUtils.deepCopy(this.board),
            movesCount: this.movesCount,
            hintsUsed: this.hintsUsed
        });

        // 恢复上一个状态
        const previousState = this.gameHistory.pop();
        this.board = previousState.board;
        this.movesCount = previousState.movesCount;
        this.hintsUsed = previousState.hintsUsed;

        // 更新显示
        this.updateBoard();
        this.updateStats();
        this.updateButtons();
        this.saveGameState();

        SudokuUtils.showMessage('已撤销', 'info');
    }

    // 重做操作
    redo() {
        if (this.redoStack.length === 0) return;

        // 保存当前状态到历史栈
        this.saveHistory();

        // 恢复重做状态
        const nextState = this.redoStack.pop();
        this.board = nextState.board;
        this.movesCount = nextState.movesCount;
        this.hintsUsed = nextState.hintsUsed;

        // 更新显示
        this.updateBoard();
        this.updateStats();
        this.updateButtons();
        this.saveGameState();

        SudokuUtils.showMessage('已重做', 'info');
    }

    // 保存操作历史状态
    saveGameHistoryState() {
        this.gameHistory.push({
            board: SudokuUtils.deepCopy(this.board),
            movesCount: this.movesCount,
            hintsUsed: this.hintsUsed
        });

        // 限制历史记录数量
        if (this.gameHistory.length > 50) {
            this.gameHistory.shift();
        }
    }

    // 重置游戏
    resetGame() {
        if (!SudokuUtils.confirm('确定要重置当前游戏吗？所有进度将会丢失。')) {
            return;
        }

        // 停止计时器
        this.stopTimer();

        // 重置到初始状态
        this.board = SudokuUtils.deepCopy(this.initialBoard);
        this.selectedCell = null;
        this.movesCount = 0;
        this.hintsUsed = 0;
        this.gameHistory = [];
        this.redoStack = [];
        this.isGameComplete = false;
        this.isGameStarted = false;
        this.gameTime = 0;

        // 更新显示
        this.updateBoard();
        this.updateStats();
        this.updateButtons();

        // 保存游戏状态
        this.saveGameState();

        SudokuUtils.showMessage('游戏已重置', 'info');
    }

    // 给出提示
    giveHint() {
        if (this.isGameComplete) return;

        // 找到一个空的格子
        const emptyCells = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.board[i][j] === 0) {
                    emptyCells.push({ row: i, col: j });
                }
            }
        }

        if (emptyCells.length === 0) return;

        // 随机选择一个空格子
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const { row, col } = randomCell;

        // 保存操作历史状态
        this.saveGameHistoryState();
        this.redoStack = [];

        // 填入正确答案
        this.board[row][col] = this.solution[row][col];
        this.hintsUsed++;

        // 显示提示效果
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('hint');
        setTimeout(() => {
            cell.classList.remove('hint');
        }, 2000);

        // 更新显示
        this.updateBoard();
        this.updateStats();
        this.updateButtons();

        // 检查游戏是否完成
        this.checkGameComplete();

        // 保存游戏状态
        this.saveGameState();

        SudokuUtils.showMessage(`提示：在 (${row + 1}, ${col + 1}) 填入 ${this.solution[row][col]}`, 'info');
    }

    // 检查游戏是否完成
    checkGameComplete() {
        if (SudokuValidator.isComplete(this.board)) {
            this.isGameComplete = true;
            this.stopTimer();

            // 添加庆祝效果
            this.showCelebration();

            // 保存游戏记录
            this.saveGameRecord();

            // 更新历史记录显示
            this.updateHistoryDisplay();

            SudokuUtils.showMessage('恭喜你！游戏完成！', 'success');
        }
    }

    // 显示庆祝效果
    showCelebration() {
        const container = document.querySelector('.game-container');
        container.classList.add('celebration');
        setTimeout(() => {
            container.classList.remove('celebration');
        }, 1000);
    }

    // 保存游戏记录
    saveGameRecord() {
        const record = {
            gameId: this.gameId,
            difficulty: this.difficulty,
            time: this.gameTime,
            moves: this.movesCount,
            hints: this.hintsUsed,
            completedAt: SudokuUtils.getTimestamp()
        };

        // 添加到内存中的记录
        this.gameRecords.push(record);

        // 只保留最近100条记录
        if (this.gameRecords.length > 100) {
            this.gameRecords.splice(0, this.gameRecords.length - 100);
        }

        // 保存到本地存储
        this.saveHistory();
    }

    // 开始计时
    startTimer() {
        this.gameTimer = setInterval(() => {
            this.gameTime++;
            this.updateTimeDisplay();
        }, 1000);
    }

    // 停止计时
    stopTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }

    // 更新时间显示
    updateTimeDisplay() {
        const timeElement = document.getElementById('time');
        timeElement.textContent = SudokuUtils.formatTime(this.gameTime);
    }

    // 更新游戏棋盘显示
    updateBoard() {
        const cells = document.querySelectorAll('.sudoku-cell');

        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const value = this.board[row][col];

            // 保存笔记容器引用
            const notesContainer = cell.querySelector('.notes-container');

            // 更新格子内容（保留笔记容器）
            cell.innerHTML = '';
            if (value !== 0) {
                cell.textContent = value;
            }

            // 重新添加笔记容器
            if (notesContainer) {
                cell.appendChild(notesContainer);
            }

            // 更新格子样式
            cell.className = 'sudoku-cell';

            // 固定数字样式
            if (this.initialBoard[row][col] !== 0) {
                cell.classList.add('fixed');
            }

            // 选中格子样式
            if (this.selectedCell && this.selectedCell.row === row && this.selectedCell.col === col) {
                cell.classList.add('selected');
            }

            // 相同数字高亮
            if (this.selectedCell && value !== 0 && value === this.board[this.selectedCell.row][this.selectedCell.col]) {
                cell.classList.add('same-value');
            }

            // 添加空单元格标记（用于CSS选择器）
            if (value === 0) {
                cell.classList.add('empty');
            }
        });

        // 更新所有单元格的笔记显示
        this.updateAllCellsNotes();
    }

    // 更新统计信息
    updateStats() {
        document.getElementById('hints-used').textContent = this.hintsUsed;
        document.getElementById('moves-count').textContent = this.movesCount;

        const completionRate = SudokuUtils.calculateCompletionRate(this.board, this.solution);
        document.getElementById('completion-rate').textContent = completionRate + '%';

        this.updateTimeDisplay();
    }

    // 更新按钮状态
    updateButtons() {
        document.getElementById('undo-btn').disabled = this.gameHistory.length === 0;
        document.getElementById('redo-btn').disabled = this.redoStack.length === 0;
        document.getElementById('hint-btn').disabled = this.isGameComplete;

        // 更新升级按钮成本显示
        const difficultySelect = document.getElementById('difficulty-select');
        difficultySelect.value = this.difficulty;
    }

    // 处理键盘输入
    handleKeyPress(event) {
        if (this.isGameComplete) return;

        // 数字键输入
        if (event.key >= '1' && event.key <= '9') {
            const number = parseInt(event.key);
            if (this.notesMode && this.selectedCell) {
                // 笔记模式下，使用笔记功能
                this.toggleNoteNumber(number);
            } else {
                // 正常模式下，输入数字
                this.inputNumber(number);
            }
        } else if (event.key === '0' || event.key === 'Delete' || event.key === 'Backspace') {
            if (this.notesMode && this.selectedCell) {
                // 笔记模式下，清除笔记
                const key = `${this.selectedCell.row},${this.selectedCell.col}`;
                if (this.notes[key] && this.notes[key].length > 0) {
                    this.saveNotesState();
                    delete this.notes[key];
                    this.updateCellNotes(this.selectedCell.row, this.selectedCell.col);
                    this.updateNotesControls();
                    this.saveGameState();
                }
            } else {
                // 正常模式下，清除数字
                this.inputNumber(0);
            }
        }

        // 方向键导航
        if (this.selectedCell) {
            const { row, col } = this.selectedCell;
            let newRow = row;
            let newCol = col;

            switch (event.key) {
                case 'ArrowUp':
                    newRow = Math.max(0, row - 1);
                    break;
                case 'ArrowDown':
                    newRow = Math.min(8, row + 1);
                    break;
                case 'ArrowLeft':
                    newCol = Math.max(0, col - 1);
                    break;
                case 'ArrowRight':
                    newCol = Math.min(8, col + 1);
                    break;
                default:
                    return;
            }

            if (newRow !== row || newCol !== col) {
                event.preventDefault();
                this.selectCell(newRow, newCol);
            }
        }

        // 快捷键
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'z':
                    event.preventDefault();
                    this.undo();
                    break;
                case 'y':
                    event.preventDefault();
                    this.redo();
                    break;
                case 'h':
                    event.preventDefault();
                    this.giveHint();
                    break;
                case 'n':
                    event.preventDefault();
                    this.startNewGame();
                    break;
            }
        }
    }

    // 保存游戏状态
    saveGameState() {
        const gameState = {
            board: this.board,
            solution: this.solution,
            initialBoard: this.initialBoard,
            difficulty: this.difficulty,
            gameTime: this.gameTime,
            movesCount: this.movesCount,
            hintsUsed: this.hintsUsed,
            gameHistory: this.gameHistory,
            redoStack: this.redoStack,
            isGameComplete: this.isGameComplete,
            isGameStarted: this.isGameStarted,
            gameId: this.gameId,
            // 笔记功能数据
            notes: this.notes,
            notesMode: this.notesMode,
            notesHistory: this.notesHistory,
            notesRedoStack: this.notesRedoStack,
            savedAt: SudokuUtils.getTimestamp()
        };

        SudokuUtils.storage.save('sudoku_current_game', gameState);
    }

    // 加载游戏状态
    loadGameState(gameState) {
        this.board = gameState.board || this.board;
        this.solution = gameState.solution || this.solution;
        this.initialBoard = gameState.initialBoard || this.initialBoard;
        this.difficulty = gameState.difficulty || this.difficulty;
        this.gameTime = gameState.gameTime || 0;
        this.movesCount = gameState.movesCount || 0;
        this.hintsUsed = gameState.hintsUsed || 0;
        this.gameHistory = gameState.gameHistory || [];
        this.redoStack = gameState.redoStack || [];
        this.isGameComplete = gameState.isGameComplete || false;
        this.isGameStarted = gameState.isGameStarted || false;
        this.gameId = gameState.gameId || this.gameId;

        // 加载笔记功能数据
        this.notes = gameState.notes || {};
        this.notesMode = gameState.notesMode || false;
        this.notesHistory = gameState.notesHistory || [];
        this.notesRedoStack = gameState.notesRedoStack || [];

        // 如果游戏正在进行的，重新开始计时
        if (this.isGameStarted && !this.isGameComplete) {
            this.startTimer();
        }

        // 更新显示
        this.updateBoard();
        this.updateStats();
        this.updateButtons();
    }

    // 加载游戏设置
    loadSettings() {
        const settings = SudokuUtils.storage.load('sudoku_settings', {
            difficulty: 'medium',
            theme: 'default'
        });

        this.difficulty = settings.difficulty;
        document.getElementById('difficulty-select').value = this.difficulty;
    }

    // 保存游戏设置
    saveSettings() {
        const settings = {
            difficulty: this.difficulty,
            theme: 'default'
        };

        SudokuUtils.storage.save('sudoku_settings', settings);
    }

    // 加载统计数据
    loadStatistics() {
        // 这里可以加载和显示更详细的统计信息
        const records = SudokuUtils.storage.load('sudoku_records', []);
        // 可以在界面上显示统计信息
    }

    // 加载历史记录
    loadHistory() {
        this.gameRecords = SudokuUtils.storage.load('sudoku_records', []);
        this.updateHistoryDisplay();
    }

    // 保存历史记录
    saveHistory() {
        SudokuUtils.storage.save('sudoku_records', this.gameRecords);
    }

    // 切换历史记录显示
    toggleHistory() {
        const historyContent = document.getElementById('history-content');
        const toggleBtn = document.getElementById('toggle-history');

        if (historyContent.style.display === 'none') {
            historyContent.style.display = 'block';
            toggleBtn.textContent = '📋 隐藏历史';
            this.updateHistoryDisplay();
        } else {
            historyContent.style.display = 'none';
            toggleBtn.textContent = '📋 查看历史';
        }
    }

    // 更新历史记录显示
    updateHistoryDisplay() {
        this.updateHistorySummary();
        this.updateHistoryList();
    }

    // 更新历史记录摘要
    updateHistorySummary() {
        const summaryElement = document.getElementById('history-summary');

        if (this.gameRecords.length === 0) {
            summaryElement.innerHTML = '<div class="empty-history"><div class="empty-history-icon">📊</div><div>暂无游戏记录</div></div>';
            return;
        }

        const stats = this.calculateHistoryStats();

        summaryElement.innerHTML = `
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="value">${stats.totalGames}</span>
                    <span class="label">总游戏数</span>
                </div>
                <div class="summary-item">
                    <span class="value">${stats.averageTime}</span>
                    <span class="label">平均用时</span>
                </div>
                <div class="summary-item">
                    <span class="value">${stats.averageMoves}</span>
                    <span class="label">平均步数</span>
                </div>
                <div class="summary-item">
                    <span class="value">${stats.averageHints}</span>
                    <span class="label">平均提示</span>
                </div>
                <div class="summary-item">
                    <span class="value">${stats.bestTime}</span>
                    <span class="label">最佳时间</span>
                </div>
                <div class="summary-item">
                    <span class="value">${stats.completionRate}%</span>
                    <span class="label">完成率</span>
                </div>
            </div>
        `;
    }

    // 更新历史记录列表
    updateHistoryList() {
        const listElement = document.getElementById('history-list');

        if (this.gameRecords.length === 0) {
            listElement.innerHTML = '<div class="empty-history"><div class="empty-history-icon">📝</div><div>暂无详细记录</div></div>';
            return;
        }

        // 按时间倒序排列
        const sortedHistory = [...this.gameRecords].sort((a, b) =>
            new Date(b.completedAt) - new Date(a.completedAt)
        );

        // 只显示最近20条记录
        const recentHistory = sortedHistory.slice(0, 20);

        listElement.innerHTML = recentHistory.map((record, index) => `
            <div class="history-item" style="animation-delay: ${index * 0.05}s">
                <div class="history-difficulty difficulty-${record.difficulty}">
                    ${this.getDifficultyText(record.difficulty)}
                </div>
                <div class="history-details">
                    <div class="date">${SudokuUtils.formatDate(SudokuUtils.parseTimestamp(record.completedAt))}</div>
                    <div class="history-stats">
                        <div class="stat-item">
                            <span>⏱️</span>
                            <span class="stat-value">${SudokuUtils.formatTime(record.time)}</span>
                        </div>
                        <div class="stat-item">
                            <span>✏️</span>
                            <span class="stat-value">${record.moves}</span>
                        </div>
                        <div class="stat-item">
                            <span>💡</span>
                            <span class="stat-value">${record.hints}</span>
                        </div>
                        <div class="stat-item">
                            <span>🎯</span>
                            <span class="stat-value">${this.calculateAccuracy(record)}%</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 计算历史统计信息
    calculateHistoryStats() {
        const totalGames = this.gameRecords.length;

        if (totalGames === 0) {
            return {
                totalGames: 0,
                averageTime: '00:00',
                averageMoves: 0,
                averageHints: 0,
                bestTime: '00:00',
                completionRate: 0
            };
        }

        const totalTime = this.gameRecords.reduce((sum, record) => sum + record.time, 0);
        const totalMoves = this.gameRecords.reduce((sum, record) => sum + record.moves, 0);
        const totalHints = this.gameRecords.reduce((sum, record) => sum + record.hints, 0);
        const bestTime = Math.min(...this.gameRecords.map(record => record.time));
        const completedGames = this.gameRecords.length; // 所有记录都是完成的游戏

        return {
            totalGames: totalGames,
            averageTime: SudokuUtils.formatTime(Math.round(totalTime / totalGames)),
            averageMoves: Math.round(totalMoves / totalGames),
            averageHints: Math.round(totalHints / totalGames),
            bestTime: SudokuUtils.formatTime(bestTime),
            completionRate: Math.round((completedGames / totalGames) * 100)
        };
    }

    // 计算游戏准确率
    calculateAccuracy(record) {
        // 假设一个数独有81个格子，初始有 clues 个格子已填
        const clues = 81 - this.getEmptyCellsCountByDifficulty(record.difficulty);
        const filledCells = record.moves;
        const correctCells = filledCells - record.hints; // 减去提示的格子

        if (filledCells === 0) return 100;

        return Math.round((correctCells / filledCells) * 100);
    }

    // 根据难度获取空格数量
    getEmptyCellsCountByDifficulty(difficulty) {
        const emptyCounts = {
            easy: 40,
            medium: 50,
            hard: 60
        };
        return emptyCounts[difficulty] || 45;
    }

    // 获取难度文本
    getDifficultyText(difficulty) {
        const difficultyTexts = {
            easy: '简单',
            medium: '中等',
            hard: '困难'
        };
        return difficultyTexts[difficulty] || '未知';
    }

    // 清除历史记录
    clearHistory() {
        if (!SudokuUtils.confirm('确定要清除所有历史记录吗？此操作无法撤销。')) {
            return;
        }

        this.gameRecords = [];
        this.saveHistory();
        this.updateHistoryDisplay();

        SudokuUtils.showMessage('历史记录已清除', 'info');
    }

    // 导出历史记录
    exportHistory() {
        if (this.gameRecords.length === 0) {
            SudokuUtils.showMessage('暂无历史记录可导出', 'error');
            return;
        }

        const exportData = {
            exportTime: SudokuUtils.getTimestamp(),
            totalGames: this.gameRecords.length,
            stats: this.calculateHistoryStats(),
            records: this.gameRecords
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `sudoku_history_${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(url);

        SudokuUtils.showMessage('历史记录已导出', 'success');
    }

    // ========== 笔记功能方法 ==========

    // 创建笔记网格
    createNotesGrid() {
        let grid = '<div class="notes-grid">';
        for (let i = 1; i <= 9; i++) {
            grid += `<div class="note-number" data-number="${i}">${i}</div>`;
        }
        grid += '</div>';
        return grid;
    }

    // 切换笔记模式
    toggleNotesMode(enabled) {
        this.notesMode = enabled;
        const gameContainer = document.querySelector('.game-container');
        const indicator = document.getElementById('notes-mode-indicator');

        if (enabled) {
            gameContainer.classList.add('notes-mode');
            indicator.classList.add('show');
            this.updateNotesControls();
        } else {
            gameContainer.classList.remove('notes-mode');
            indicator.classList.remove('show');
            this.hideNotesSelector();
        }
    }

    // 更新笔记控制按钮状态
    updateNotesControls() {
        const clearBtn = document.getElementById('clear-notes-btn');
        const autoBtn = document.getElementById('auto-notes-btn');
        const hasNotes = Object.keys(this.notes).length > 0;
        const hasSelectedCell = this.selectedCell && this.board[this.selectedCell.row][this.selectedCell.col] === 0;

        clearBtn.disabled = !hasNotes;
        autoBtn.disabled = !hasSelectedCell;
    }

    // 切换单元格的笔记数字
    toggleNoteNumber(number) {
        if (!this.selectedCell || this.notesMode === false) return;

        const { row, col } = this.selectedCell;
        const key = `${row},${col}`;

        // 保存当前状态到历史
        this.saveNotesState();

        if (!this.notes[key]) {
            this.notes[key] = [];
        }

        const index = this.notes[key].indexOf(number);
        if (index > -1) {
            // 移除数字
            this.notes[key].splice(index, 1);
            if (this.notes[key].length === 0) {
                delete this.notes[key];
            }
        } else {
            // 添加数字
            this.notes[key].push(number);
            this.notes[key].sort((a, b) => a - b);
        }

        this.updateCellNotes(row, col);
        this.updateNotesControls();
        this.saveGameState();
    }

    // 更新单元格笔记显示
    updateCellNotes(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!cell) return;

        const notesContainer = cell.querySelector('.notes-container');
        if (!notesContainer) return;

        const noteNumbers = notesContainer.querySelectorAll('.note-number');
        const key = `${row},${col}`;
        const notes = this.notes[key] || [];

        // 更新单元格样式
        if (notes.length > 0) {
            cell.classList.add('has-notes');
        } else {
            cell.classList.remove('has-notes');
        }

        // 更新笔记数字显示
        noteNumbers.forEach(noteEl => {
            const number = parseInt(noteEl.dataset.number);
            if (notes.includes(number)) {
                noteEl.classList.add('active');
            } else {
                noteEl.classList.remove('active');
            }
        });
    }

    // 清除所有笔记
    clearAllNotes() {
        if (Object.keys(this.notes).length === 0) return;

        if (SudokuUtils.confirm('确定要清除所有笔记吗？')) {
            this.saveNotesState();
            this.notes = {};
            this.updateAllCellsNotes();
            this.updateNotesControls();
            this.saveGameState();
            SudokuUtils.showMessage('所有笔记已清除', 'info');
        }
    }

    // 自动填充笔记（显示当前单元格的所有可能数字）
    autoFillNotes() {
        if (!this.selectedCell || this.board[this.selectedCell.row][this.selectedCell.col] !== 0) return;

        const { row, col } = this.selectedCell;
        const validNumbers = SudokuValidator.getValidNumbers(this.board, row, col);

        if (validNumbers.length === 0) {
            SudokuUtils.showMessage('该单元格没有可能的数字', 'warning');
            return;
        }

        this.saveNotesState();
        const key = `${row},${col}`;
        this.notes[key] = [...validNumbers];

        this.updateCellNotes(row, col);
        this.updateNotesControls();
        this.saveGameState();
        SudokuUtils.showMessage(`已自动填充 ${validNumbers.length} 个候选数字`, 'success');
    }

    // 更新所有单元格的笔记显示
    updateAllCellsNotes() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                // 添加安全检查，确保单元格存在
                const cell = document.querySelector(`[data-row="${i}"][data-col="${j}"]`);
                if (cell) {
                    this.updateCellNotes(i, j);
                }
            }
        }
    }

    // 保存笔记状态（用于撤销/重做）
    saveNotesState() {
        const state = JSON.parse(JSON.stringify(this.notes));
        this.notesHistory.push(state);
        this.notesRedoStack = []; // 清空重做栈

        // 限制历史记录长度
        if (this.notesHistory.length > 50) {
            this.notesHistory.shift();
        }
    }

    // 撤销笔记操作
    undoNotes() {
        if (this.notesHistory.length === 0) return;

        const currentState = JSON.parse(JSON.stringify(this.notes));
        this.notesRedoStack.push(currentState);

        const previousState = this.notesHistory.pop();
        this.notes = previousState;

        this.updateAllCellsNotes();
        this.updateNotesControls();
        this.saveGameState();
    }

    // 重做笔记操作
    redoNotes() {
        if (this.notesRedoStack.length === 0) return;

        const currentState = JSON.parse(JSON.stringify(this.notes));
        this.notesHistory.push(currentState);

        const nextState = this.notesRedoStack.pop();
        this.notes = nextState;

        this.updateAllCellsNotes();
        this.updateNotesControls();
        this.saveGameState();
    }

    // 显示笔记数字选择器
    showNotesSelector(cell) {
        const selector = document.getElementById('notes-number-selector');
        const rect = cell.getBoundingClientRect();

        selector.style.left = rect.left + rect.width / 2 + 'px';
        selector.style.top = rect.bottom + 5 + 'px';
        selector.classList.add('show');

        // 更新按钮状态
        const key = `${cell.dataset.row},${cell.dataset.col}`;
        const notes = this.notes[key] || [];
        selector.querySelectorAll('.notes-number-btn').forEach(btn => {
            const number = parseInt(btn.dataset.number);
            if (notes.includes(number)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // 隐藏笔记数字选择器
    hideNotesSelector() {
        const selector = document.getElementById('notes-number-selector');
        selector.classList.remove('show');
    }

    // 处理单元格右键点击（显示笔记选择器）
    handleCellRightClick(row, col, e) {
        e.preventDefault();

        if (this.board[row][col] !== 0) return; // 非空单元格不显示笔记

        const cell = e.target.closest('.sudoku-cell');
        this.selectCell(row, col);
        this.showNotesSelector(cell);
    }

    // ========== 笔记功能方法结束 ==========

    // 清除游戏数据
    clearGameData() {
        if (SudokuUtils.confirm('确定要清除所有游戏数据吗？这将删除所有保存的游戏和记录。')) {
            SudokuUtils.storage.remove('sudoku_current_game');
            SudokuUtils.storage.remove('sudoku_records');
            SudokuUtils.storage.remove('sudoku_settings');

            // 重置游戏
            this.startNewGame();
            this.loadHistory();

            SudokuUtils.showMessage('游戏数据已清除', 'info');
        }
    }
}

// 游戏初始化
document.addEventListener('DOMContentLoaded', () => {
    window.sudokuGame = new SudokuGame();
});
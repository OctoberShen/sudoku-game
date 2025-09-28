/**
 * 数独生成算法
 */

class SudokuGenerator {
    // 生成完整的数独解
    static generateCompleteSudoku() {
        const board = Array(9).fill().map(() => Array(9).fill(0));

        // 填充对角线的3个3x3区块（这些区块相互独立）
        for (let block = 0; block < 9; block += 3) {
            this.fillDiagonalBlock(board, block, block);
        }

        // 使用回溯算法填充剩余格子
        this.solveSudoku(board);

        return board;
    }

    // 填充对角线区块
    static fillDiagonalBlock(board, startRow, startCol) {
        const numbers = SudokuUtils.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        let index = 0;

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                board[startRow + i][startCol + j] = numbers[index++];
            }
        }
    }

    // 使用回溯算法求解数独
    static solveSudoku(board) {
        const emptyCell = this.findEmptyCell(board);
        if (!emptyCell) {
            return true; // 没有空格，求解完成
        }

        const { row, col } = emptyCell;
        const validNumbers = SudokuValidator.getValidNumbers(board, row, col);

        // 随机打乱有效数字，增加随机性
        const shuffledNumbers = SudokuUtils.shuffle(validNumbers);

        for (const num of shuffledNumbers) {
            board[row][col] = num;

            if (this.solveSudoku(board)) {
                return true;
            }

            board[row][col] = 0; // 回溯
        }

        return false;
    }

    // 找到第一个空格
    static findEmptyCell(board) {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j] === 0) {
                    return { row: i, col: j };
                }
            }
        }
        return null;
    }

    // 根据难度生成数独谜题
    static generatePuzzle(difficulty = 'medium') {
        // 首先生成完整的数独
        const solution = this.generateCompleteSudoku();
        const puzzle = SudokuUtils.deepCopy(solution);

        // 根据难度设置要移除的格子数量
        const difficultySettings = {
            easy: { min: 35, max: 45 },
            medium: { min: 45, max: 55 },
            hard: { min: 55, max: 65 }
        };

        const settings = difficultySettings[difficulty];
        const cellsToRemove = SudokuUtils.randomInt(settings.min, settings.max);

        // 随机移除数字
        const removedCells = this.removeCells(puzzle, solution, cellsToRemove);

        // 确保谜题有唯一解
        if (!SudokuValidator.hasUniqueSolution(puzzle)) {
            // 如果没有唯一解，重新生成
            return this.generatePuzzle(difficulty);
        }

        return {
            puzzle: puzzle,
            solution: solution,
            difficulty: difficulty,
            cellsRemoved: removedCells.length
        };
    }

    // 移除指定数量的格子
    static removeCells(puzzle, solution, count) {
        const removedCells = [];
        const positions = [];

        // 创建所有位置的列表
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                positions.push({ row: i, col: j });
            }
        }

        // 随机打乱位置
        const shuffledPositions = SudokuUtils.shuffle(positions);

        for (let i = 0; i < count && i < shuffledPositions.length; i++) {
            const { row, col } = shuffledPositions[i];

            // 临时移除数字
            const removedValue = puzzle[row][col];
            puzzle[row][col] = 0;
            removedCells.push({ row, col, value: removedValue });

            // 检查是否仍有唯一解
            if (!SudokuValidator.hasUniqueSolution(puzzle)) {
                // 如果没有唯一解，恢复数字
                puzzle[row][col] = removedValue;
                removedCells.pop();
            }
        }

        return removedCells;
    }

    // 生成多个不同难度的谜题
    static generateMultiplePuzzles(count = 1, difficulty = 'medium') {
        const puzzles = [];
        const usedPuzzles = new Set();

        for (let i = 0; i < count; i++) {
            let puzzle;
            let attempts = 0;
            const maxAttempts = 100;

            do {
                puzzle = this.generatePuzzle(difficulty);
                attempts++;
            } while (attempts < maxAttempts && this.isPuzzleDuplicate(puzzle.puzzle, usedPuzzles));

            if (attempts < maxAttempts) {
                puzzles.push(puzzle);
                usedPuzzles.add(this.getPuzzleSignature(puzzle.puzzle));
            }
        }

        return puzzles;
    }

    // 检查谜题是否重复
    static isPuzzleDuplicate(puzzle, usedPuzzles) {
        const signature = this.getPuzzleSignature(puzzle);
        return usedPuzzles.has(signature);
    }

    // 获取谜题的签名（用于去重）
    static getPuzzleSignature(puzzle) {
        const signature = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                signature.push(puzzle[i][j]);
            }
        }
        return signature.join(',');
    }

    // 从预设的谜题中随机选择
    static generateFromPresets(difficulty = 'medium') {
        // 这里可以预设一些高质量的数独谜题
        const presets = {
            easy: [
                // 简单谜题示例
                [
                    [5,3,0,0,7,0,0,0,0],
                    [6,0,0,1,9,5,0,0,0],
                    [0,9,8,0,0,0,0,6,0],
                    [8,0,0,0,6,0,0,0,3],
                    [4,0,0,8,0,3,0,0,1],
                    [7,0,0,0,2,0,0,0,6],
                    [0,6,0,0,0,0,2,8,0],
                    [0,0,0,4,1,9,0,0,5],
                    [0,0,0,0,8,0,0,7,9]
                ]
            ],
            medium: [
                // 中等谜题示例
                [
                    [0,0,0,6,0,0,4,0,0],
                    [7,0,0,0,0,3,6,0,0],
                    [0,0,0,0,9,1,0,8,0],
                    [5,0,0,0,0,0,0,0,0],
                    [0,0,8,0,0,0,1,0,0],
                    [0,0,1,0,0,0,0,0,3],
                    [0,2,0,5,1,0,0,0,0],
                    [0,0,3,7,0,0,0,0,4],
                    [0,0,6,0,0,8,0,0,0]
                ]
            ],
            hard: [
                // 困难谜题示例
                [
                    [8,0,0,0,0,0,0,0,0],
                    [0,0,3,6,0,0,0,0,0],
                    [0,7,0,0,9,0,2,0,0],
                    [0,5,0,0,0,7,0,0,0],
                    [0,0,0,0,4,5,7,0,0],
                    [0,0,0,1,0,0,0,3,0],
                    [0,0,1,0,0,0,0,6,8],
                    [0,0,8,5,0,0,0,1,0],
                    [0,9,0,0,0,0,4,0,0]
                ]
            ]
        };

        const difficultyPresets = presets[difficulty] || presets.medium;
        if (difficultyPresets.length === 0) {
            return this.generatePuzzle(difficulty);
        }

        const randomPreset = difficultyPresets[Math.floor(Math.random() * difficultyPresets.length)];
        const solution = this.generateSolutionForPuzzle(randomPreset);

        return {
            puzzle: randomPreset,
            solution: solution,
            difficulty: difficulty,
            cellsRemoved: SudokuUtils.getEmptyCells(randomPreset).length
        };
    }

    // 为给定谜题生成解
    static generateSolutionForPuzzle(puzzle) {
        const board = SudokuUtils.deepCopy(puzzle);
        this.solveSudoku(board);
        return board;
    }

    // 验证生成的谜题质量
    static validatePuzzleQuality(puzzle) {
        const emptyCells = SudokuUtils.getEmptyCells(puzzle);
        const conflicts = SudokuValidator.findConflicts(puzzle);
        const hasUniqueSolution = SudokuValidator.hasUniqueSolution(puzzle);

        return {
            isValid: conflicts.length === 0 && hasUniqueSolution,
            conflicts: conflicts,
            hasUniqueSolution: hasUniqueSolution,
            emptyCellCount: emptyCells.length,
            difficulty: SudokuValidator.getDifficultyScore(puzzle)
        };
    }

    // 生成具有特定模式的谜题
    static generatePatternPuzzle(pattern = 'symmetric', difficulty = 'medium') {
        const solution = this.generateCompleteSudoku();
        const puzzle = SudokuUtils.deepCopy(solution);

        // 根据模式确定移除格子的方式
        const cellsToRemove = this.getCellsToRemoveByPattern(pattern, difficulty);

        for (const { row, col } of cellsToRemove) {
            puzzle[row][col] = 0;
        }

        // 验证谜题质量
        const quality = this.validatePuzzleQuality(puzzle);
        if (!quality.isValid) {
            // 如果质量不达标，使用标准方法生成
            return this.generatePuzzle(difficulty);
        }

        return {
            puzzle: puzzle,
            solution: solution,
            difficulty: difficulty,
            pattern: pattern,
            cellsRemoved: cellsToRemove.length
        };
    }

    // 根据模式获取要移除的格子
    static getCellsToRemoveByPattern(pattern, difficulty) {
        const targetCells = {
            easy: 40,
            medium: 50,
            hard: 60
        }[difficulty];

        const cellsToRemove = [];

        if (pattern === 'symmetric') {
            // 对称模式：同时移除对称位置的格子
            const positions = [];
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    positions.push({ row: i, col: j });
                }
            }

            const shuffledPositions = SudokuUtils.shuffle(positions);
            const used = new Set();

            for (const pos of shuffledPositions) {
                if (cellsToRemove.length >= targetCells) break;

                const key = `${pos.row}-${pos.col}`;
                const mirrorKey = `${pos.row}-${8 - pos.col}`;

                if (!used.has(key) && !used.has(mirrorKey)) {
                    cellsToRemove.push(pos);
                    cellsToRemove.push({ row: pos.row, col: 8 - pos.col });
                    used.add(key);
                    used.add(mirrorKey);
                }
            }
        } else {
            // 随机模式
            const positions = [];
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    positions.push({ row: i, col: j });
                }
            }

            const shuffledPositions = SudokuUtils.shuffle(positions);
            for (let i = 0; i < targetCells && i < shuffledPositions.length; i++) {
                cellsToRemove.push(shuffledPositions[i]);
            }
        }

        return cellsToRemove;
    }

    // 批量生成谜题并保存
    static generateAndSavePuzzles(count = 10, difficulty = 'medium') {
        const puzzles = this.generateMultiplePuzzles(count, difficulty);

        // 保存到本地存储
        const storageKey = `sudoku_puzzles_${difficulty}`;
        const existingPuzzles = SudokuUtils.storage.load(storageKey, []);

        puzzles.forEach(puzzle => {
            puzzle.id = SudokuUtils.generateGameId();
            puzzle.createdAt = SudokuUtils.getTimestamp();
            existingPuzzles.push(puzzle);
        });

        SudokuUtils.storage.save(storageKey, existingPuzzles);

        return puzzles;
    }

    // 从本地存储加载谜题
    static loadPuzzles(difficulty = 'medium') {
        const storageKey = `sudoku_puzzles_${difficulty}`;
        return SudokuUtils.storage.load(storageKey, []);
    }

    // 清除已保存的谜题
    static clearSavedPuzzles(difficulty = null) {
        if (difficulty) {
            const storageKey = `sudoku_puzzles_${difficulty}`;
            SudokuUtils.storage.remove(storageKey);
        } else {
            // 清除所有难度的谜题
            ['easy', 'medium', 'hard'].forEach(diff => {
                const storageKey = `sudoku_puzzles_${diff}`;
                SudokuUtils.storage.remove(storageKey);
            });
        }
    }
}

// 导出生成器
window.SudokuGenerator = SudokuGenerator;
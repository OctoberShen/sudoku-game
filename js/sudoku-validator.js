/**
 * 数独验证算法
 */

class SudokuValidator {
    // 检查数字在行中是否有效
    static isValidInRow(board, row, col, num) {
        for (let j = 0; j < 9; j++) {
            if (j !== col && board[row][j] === num) {
                return false;
            }
        }
        return true;
    }

    // 检查数字在列中是否有效
    static isValidInCol(board, row, col, num) {
        for (let i = 0; i < 9; i++) {
            if (i !== row && board[i][col] === num) {
                return false;
            }
        }
        return true;
    }

    // 检查数字在3x3区块中是否有效
    static isValidInBlock(board, row, col, num) {
        const { startRow, startCol } = SudokuUtils.getBlockStart(row, col);
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const currentRow = startRow + i;
                const currentCol = startCol + j;
                if (currentRow !== row && currentCol !== col &&
                    board[currentRow][currentCol] === num) {
                    return false;
                }
            }
        }
        return true;
    }

    // 检查数字在指定位置是否有效
    static isValidMove(board, row, col, num) {
        // 如果该位置已有数字，不能放置
        if (board[row][col] !== 0) {
            return false;
        }

        // 检查行、列、区块
        return this.isValidInRow(board, row, col, num) &&
               this.isValidInCol(board, row, col, num) &&
               this.isValidInBlock(board, row, col, num);
    }

    // 获取指定位置的有效数字列表
    static getValidNumbers(board, row, col) {
        const validNumbers = [];
        for (let num = 1; num <= 9; num++) {
            if (this.isValidMove(board, row, col, num)) {
                validNumbers.push(num);
            }
        }
        return validNumbers;
    }

    // 检查整个数独是否有效（不要求完整）
    static isValidBoard(board) {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const num = board[i][j];
                if (num !== 0) {
                    // 临时清空该位置，检查是否有效
                    board[i][j] = 0;
                    const isValid = this.isValidMove(board, i, j, num);
                    board[i][j] = num; // 恢复数字

                    if (!isValid) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    // 检查数独是否完成
    static isComplete(board) {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j] === 0) {
                    return false;
                }
            }
        }
        return this.isValidBoard(board);
    }

    // 检查行是否有效
    static isValidRow(board, row) {
        const seen = new Set();
        for (let j = 0; j < 9; j++) {
            const num = board[row][j];
            if (num !== 0) {
                if (seen.has(num)) {
                    return false;
                }
                seen.add(num);
            }
        }
        return true;
    }

    // 检查列是否有效
    static isValidCol(board, col) {
        const seen = new Set();
        for (let i = 0; i < 9; i++) {
            const num = board[i][col];
            if (num !== 0) {
                if (seen.has(num)) {
                    return false;
                }
                seen.add(num);
            }
        }
        return true;
    }

    // 检查3x3区块是否有效
    static isValidBlock(board, blockRow, blockCol) {
        const seen = new Set();
        const startRow = blockRow * 3;
        const startCol = blockCol * 3;

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const num = board[startRow + i][startCol + j];
                if (num !== 0) {
                    if (seen.has(num)) {
                        return false;
                    }
                    seen.add(num);
                }
            }
        }
        return true;
    }

    // 检查所有区块是否有效
    static areAllBlocksValid(board) {
        for (let blockRow = 0; blockRow < 3; blockRow++) {
            for (let blockCol = 0; blockCol < 3; blockCol++) {
                if (!this.isValidBlock(board, blockRow, blockCol)) {
                    return false;
                }
            }
        }
        return true;
    }

    // 检查整个数独是否完全有效（包括所有行、列、区块）
    static isFullyValid(board) {
        // 检查所有行
        for (let i = 0; i < 9; i++) {
            if (!this.isValidRow(board, i)) {
                return false;
            }
        }

        // 检查所有列
        for (let j = 0; j < 9; j++) {
            if (!this.isValidCol(board, j)) {
                return false;
            }
        }

        // 检查所有区块
        return this.areAllBlocksValid(board);
    }

    // 找出所有冲突的位置
    static findConflicts(board) {
        const conflicts = [];

        // 检查行冲突
        for (let i = 0; i < 9; i++) {
            const seen = new Map();
            for (let j = 0; j < 9; j++) {
                const num = board[i][j];
                if (num !== 0) {
                    if (seen.has(num)) {
                        conflicts.push({ row: i, col: j, type: 'row' });
                        conflicts.push({ row: i, col: seen.get(num), type: 'row' });
                    } else {
                        seen.set(num, j);
                    }
                }
            }
        }

        // 检查列冲突
        for (let j = 0; j < 9; j++) {
            const seen = new Map();
            for (let i = 0; i < 9; i++) {
                const num = board[i][j];
                if (num !== 0) {
                    if (seen.has(num)) {
                        conflicts.push({ row: i, col: j, type: 'col' });
                        conflicts.push({ row: seen.get(num), col: j, type: 'col' });
                    } else {
                        seen.set(num, i);
                    }
                }
            }
        }

        // 检查区块冲突
        for (let blockRow = 0; blockRow < 3; blockRow++) {
            for (let blockCol = 0; blockCol < 3; blockCol++) {
                const seen = new Map();
                const startRow = blockRow * 3;
                const startCol = blockCol * 3;

                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        const row = startRow + i;
                        const col = startCol + j;
                        const num = board[row][col];

                        if (num !== 0) {
                            const key = `${row}-${col}`;
                            if (seen.has(num)) {
                                conflicts.push({ row, col, type: 'block' });
                                const [prevRow, prevCol] = seen.get(num).split('-').map(Number);
                                conflicts.push({ row: prevRow, col: prevCol, type: 'block' });
                            } else {
                                seen.set(num, key);
                            }
                        }
                    }
                }
            }
        }

        // 去重
        const uniqueConflicts = [];
        const seen = new Set();
        for (const conflict of conflicts) {
            const key = `${conflict.row}-${conflict.col}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueConflicts.push(conflict);
            }
        }

        return uniqueConflicts;
    }

    // 获取数独的难度评分（基于唯一解的数量）
    static getDifficultyScore(board) {
        const emptyCells = SudokuUtils.getEmptyCells(board);
        let totalPossibilities = 0;

        for (const cell of emptyCells) {
            const validNumbers = this.getValidNumbers(board, cell.row, cell.col);
            totalPossibilities += validNumbers.length;
        }

        // 平均每个空格的可能性
        const averagePossibilities = emptyCells.length > 0 ? totalPossibilities / emptyCells.length : 0;

        // 可能性越少，难度越高
        if (averagePossibilities >= 4) return 'easy';
        if (averagePossibilities >= 2.5) return 'medium';
        return 'hard';
    }

    // 验证是否有唯一解
    static hasUniqueSolution(board) {
        const solutions = [];
        this.findAllSolutions(board, solutions, 2); // 最多找2个解
        return solutions.length === 1;
    }

    // 找到所有可能的解（限制数量）
    static findAllSolutions(board, solutions = [], maxSolutions = 1) {
        if (solutions.length >= maxSolutions) {
            return;
        }

        // 找到第一个空格
        let emptyCell = null;
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j] === 0) {
                    emptyCell = { row: i, col: j };
                    break;
                }
            }
            if (emptyCell) break;
        }

        // 如果没有空格，找到解
        if (!emptyCell) {
            solutions.push(SudokuUtils.deepCopy(board));
            return;
        }

        // 尝试填入1-9
        for (let num = 1; num <= 9; num++) {
            if (this.isValidMove(board, emptyCell.row, emptyCell.col, num)) {
                board[emptyCell.row][emptyCell.col] = num;
                this.findAllSolutions(board, solutions, maxSolutions);
                board[emptyCell.row][emptyCell.col] = 0;
            }
        }
    }

    // 检查两个数独是否等价（通过旋转、镜像等变换）
    static areEquivalent(board1, board2) {
        // 检查原始版本
        if (SudokuUtils.arraysEqual(board1, board2)) {
            return true;
        }

        // 检查旋转
        const rotated90 = this.rotateBoard(board1, 90);
        if (SudokuUtils.arraysEqual(rotated90, board2)) return true;

        const rotated180 = this.rotateBoard(board1, 180);
        if (SudokuUtils.arraysEqual(rotated180, board2)) return true;

        const rotated270 = this.rotateBoard(board1, 270);
        if (SudokuUtils.arraysEqual(rotated270, board2)) return true;

        // 检查镜像
        const mirrored = this.mirrorBoard(board1);
        if (SudokuUtils.arraysEqual(mirrored, board2)) return true;

        return false;
    }

    // 旋转棋盘
    static rotateBoard(board, degrees) {
        const rotated = Array(9).fill().map(() => Array(9).fill(0));

        if (degrees === 90) {
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    rotated[j][8 - i] = board[i][j];
                }
            }
        } else if (degrees === 180) {
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    rotated[8 - i][8 - j] = board[i][j];
                }
            }
        } else if (degrees === 270) {
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    rotated[8 - j][i] = board[i][j];
                }
            }
        }

        return rotated;
    }

    // 镜像棋盘
    static mirrorBoard(board) {
        const mirrored = Array(9).fill().map(() => Array(9).fill(0));
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                mirrored[i][8 - j] = board[i][j];
            }
        }
        return mirrored;
    }
}

// 导出验证器
window.SudokuValidator = SudokuValidator;
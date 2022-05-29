(async () => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    const PIECES = () => [
        [
            [
                [1, 1],
                [1, 1]
            ]
        ],
        [
            [
                [1],
                [1],
                [1],
                [1]
            ],
            [
                [1, 1, 1, 1]
            ]
        ],
        [
            [
                [0, 1, 1],
                [1, 1]
            ],
            [
                [1],
                [1, 1],
                [0, 1]
            ]
        ],
        [
            [
                [1, 1],
                [0, 1, 1]
            ],
            [
                [0, 1],
                [1, 1],
                [1],
            ]
        ],
        [
            [
                [1],
                [1],
                [1, 1]
            ],
            [
                [1, 1, 1],
                [1]
            ],
            [
                [1, 1],
                [0, 1],
                [0, 1]
            ],
            [
                [0, 0, 1],
                [1, 1, 1]
            ]
        ],
        [
            [
                [0, 1],
                [0, 1],
                [1, 1]
            ],
            [
                [1],
                [1, 1, 1]
            ],
            [
                [1, 1],
                [1],
                [1]
            ],
            [
                [1, 1, 1],
                [0, 0, 1]
            ]
        ],
        [
            [
                [1, 1, 1],
                [0, 1, 0]
            ],
            [
                [0, 1],
                [1, 1],
                [0, 1]
            ],
            [
                [0, 1, 0],
                [1, 1, 1]
            ],
            [
                [1],
                [1, 1],
                [1]
            ]
        ],
        [
            [
                [0, 1, 0],
                [1, 1, 1],
                [0, 1, 0]
            ]
        ]
    ];
    const PIECE_O = 0;
    const PIECE_I = 1;
    const PIECE_S = 2;
    const PIECE_Z = 3;
    const PIECE_L = 4;
    const PIECE_J = 5;
    const PIECE_T = 6;
    const PIECE_PLUS = 7;

    const COLORS = [
        "red",
        "orange",
        "yellow",
        "green",
        "blue",
        "purple",
        "pink",
        "white"
    ];

    let nextMove = Date.now();
    /*** @type {Piece[]} */
    const pieces = [];

    class Piece {
        constructor(x, y, matrix, pieceType) {
            this.x = x;
            this.y = y;
            this.pieceType = pieceType;
            this.matrix = matrix;
        }

        getColor() {
            return COLORS[this.pieceType];
        }

        copy() {
            return new Piece(this.x, this.y, Object.create(this.matrix), this.pieceType);
        }

        getFilledPixels() {
            const result = [];
            for (let i = 0; i < this.matrix.length; i++) {
                for (let j = 0; j < this.matrix[i].length; j++) {
                    if (this.matrix[i][j] === 1) result.push([this.x + j, this.y + i, i, j]);
                }
            }
            return result;
        }

        getCollidingPieces() {
            return pieces.filter(p => p !== this && this.isColliding(p));
        }

        isColliding(piece) {
            return this.getFilledPixels().some(p => piece.getFilledPixels().some(p2 => p[0] === p2[0] && p[1] === p2[1]));
        }

        getWidth() {
            return this.matrix.sort((a, b) => b.length - a.length)[0].length;
        }

        getHeight() {
            return this.matrix.length;
        }

        applyGravity(n = 1) {
            this.y += n;
            if (this.getCollidingPieces().length > 0 || this.y + this.getHeight() > 40) {
                this.y -= n;
                return false;
            }
            return true;
        }

        update() {
            this.draw();
        }

        draw() {
            ctx.fillStyle = this.getColor();
            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
            const stroke = [];
            ctx.beginPath();
            const XRatio = 13;
            const YRatio = 20;
            const XYRatio = .5;
            for (let i = 0; i < this.matrix.length; i++) {
                for (let j = 0; j < this.matrix[i].length; j++) {
                    if (this.matrix[i][j] === 1) {
                        const X = (this.x + j) * canvas.width / XRatio * XYRatio,
                            Y = (this.y + i) * canvas.height / YRatio * XYRatio,
                            W = canvas.width / XRatio * XYRatio,
                            H = canvas.height / YRatio * XYRatio;
                        ctx.rect(X, Y, W, H);
                        stroke.push([X, Y, W, H]);
                    }
                }
            }
            ctx.stroke();
            ctx.fill();
            ctx.closePath();
            ctx.lineWidth = 0.1;
            stroke.forEach(s => ctx.strokeRect(s[0], s[1], s[2], s[3]));
        }

        toJSON() {
            return {
                x: this.x,
                y: this.y,
                matrix: this.matrix,
                pieceType: this.pieceType
            };
        }

        static fromJSON(json) {
            return new Piece(json.x, json.y, json.matrix, json.pieceType);
        }
    }

    class CPiece extends Piece {
        constructor(x, y, matrix, pieceType, rotation) {
            super(x, y, matrix, pieceType);
            this.rotation = rotation;
            this.closed = false;
        }

        update() {
            if (this.closed) return;
            this.applyGravity(0);
            if (this.x < 0) this.x = 0;
            if (this.x + this.getWidth() > 20) this.x = 20 - this.getWidth();
            this.matrix = PIECES()[this.pieceType][this.rotation];
            super.update();
        }

        move(x) {
            this.x += x;
            if (this.getCollidingPieces().length > 0) this.x -= x;
        }

        put() {
            this.closed = true;
            if (this.matrix) pieces.push(this.copy());
            const type = nextPiece.shift().pieceType;
            currentPiece = new CPiece(0, 0, PIECES()[type][0], type, 0);
            currentPiece.y = -currentPiece.getHeight();
            currentPiece.x = Math.floor(10 - currentPiece.getWidth() / 2);
            if (currentPiece.getCollidingPieces().length > 0) {
                gameOver();
            }
        }

        applyGravity(n = 1) {
            const r = super.applyGravity(n);
            if (!r || this.y + this.getHeight() > 40) this.put();
            return r;
        }
    }

    let hasEnded = false;
    let currentPiece = new CPiece(0, 0, 0, 0, 0);
    const endVelocity = -2;
    const endGravity = 0.08;
    let endFallVelocity = 0;
    const text = {y: 0, label: "Game Over"};
    let nextPiece = [];
    let linesPopped = 0;

    function gameOver() {
        hasEnded = true;
    }

    function getPiecesThatCollideY(y) {
        return pieces.filter(p => p.getFilledPixels().some(l => l[1] === y));
    }

    function getCountOfPixelsInY(y) {
        return pieces.reduce((a, p) => a + p.getFilledPixels().filter(l => l[1] === y).length, 0);
    }

    const TETRIS_TIME_ALGORITHM = {
        "0": 48 / 60,
        "1": 43 / 60,
        "2": 38 / 60,
        "3": 33 / 60,
        "4": 28 / 60,
        "5": 23 / 60,
        "6": 18 / 60,
        "7": 13 / 60,
        "8": 8 / 60,
        "9": 6 / 60,
        "10": 5 / 60,
        "13": 4 / 60,
        "16": 3 / 60,
        "19": 2 / 60,
        "29": 1 / 60
    }

    function getLevel() {
        return Math.floor(linesPopped / 5);
    }

    function getTime() {
        return TETRIS_TIME_ALGORITHM[Object.keys(TETRIS_TIME_ALGORITHM).reverse().find(k => k * 1 <= getLevel())] * 1000;
    }

    function animate() {
        canvas.width = window.innerWidth / 40 * 13;
        canvas.height = canvas.width / 13 * 20;
        while (nextPiece.length < 3) nextPiece.push(new Piece(0, 0, [], Math.floor(Math.random() * PIECES().length)));
        if (!currentPiece.matrix) currentPiece.put();
        ctx.fillStyle = "gray";
        ctx.fillRect(canvas.width / 13 * 10, 0, canvas.width / 13 * 3, canvas.height);
        nextPiece.forEach((p, i) => {
            p.matrix = PIECES()[p.pieceType][0];
            p.x = 23 - p.getWidth() / 2;
            p.y = [8, 9, 10][i] + nextPiece.slice(0, i).reduce((a, p) => a + p.getHeight(), 0);
            p.draw();
        });
        ctx.fillStyle = "black";
        ctx.font = "20px Calibri";
        const lbl1 = "Level: " + getLevel();
        ctx.fillText(lbl1, canvas.width / 13 * 11.5 - ctx.measureText(lbl1).width / 2, canvas.height / 20);
        const lbl2 = "Next";
        ctx.font = "30px Calibri";
        ctx.fillText(lbl2, canvas.width / 13 * 11.5 - ctx.measureText(lbl2).width / 2, canvas.height / 20 + 70);
        if (hasEnded) {
            endFallVelocity += endGravity;
            text.y += 2.3 * (endVelocity + endFallVelocity);
            if (text.y > canvas.height / 2) text.y = canvas.height / 2;
            for (let i = 0; i < pieces.length; i++) {
                pieces[i].y += endVelocity + endFallVelocity;
                pieces[i].draw();
            }
            ctx.fillStyle = "black";
            ctx.font = "40px Calibri";
            ctx.fillText(text.label, (canvas.width / 13 * 10) / 2 - ctx.measureText(text.label).width / 2, text.y);
        } else {
            if (Date.now() > nextMove) {
                nextMove = Date.now() + getTime();
                currentPiece.applyGravity();
            }
            currentPiece.update();
            for (let i = 0; i < pieces.length; i++) {
                pieces[i].update();
                pieces[i].applyGravity();
            }
            for (let i = 0; i < 40; i++) {
                const count = getCountOfPixelsInY(i);
                if (count === 20) for (let j = 0; j < pieces.length; j++) {
                    linesPopped++;
                    pieces[j].matrix = pieces[j].matrix.filter((m, n) => n !== pieces[j].y - i);
                }
            }
        }
        requestAnimationFrame(animate);
    }

    animate();

    addEventListener("keydown", e => {
        switch (e.key) {
            case "ArrowLeft":
                currentPiece.move(-1);
                break;
            case "ArrowRight":
                currentPiece.move(1);
                break;
            case "ArrowUp":
                currentPiece.rotation = (currentPiece.rotation + 1) % PIECES()[currentPiece.pieceType].length;
                currentPiece.matrix = PIECES()[currentPiece.pieceType][currentPiece.rotation];
                break;
            case "ArrowDown":
                currentPiece.applyGravity();
                break;
        }
    });
})();
const fs = require("fs");
const path = require("path");

class SparseMatrix {
  constructor(matrixFilePath = null, numRows = null, numCols = null) {
    if (matrixFilePath) {
      this.loadFromFile(matrixFilePath);
    } else if (numRows !== null && numCols !== null) {
      this.numRows = numRows;
      this.numCols = numCols;
      this.matrix = {};
    } else {
      throw new Error(
        "Either provide a matrix file path or specify dimensions for the matrix."
      );
    }
  }

  loadFromFile(filePath) {
    console.log(`Reading file: ${filePath}`);
    const data = fs.readFileSync(filePath, "utf-8");
    this.loadFromData(data);
  }

  loadFromData(data) {
    const lines = data.split("\n").filter((line) => line.trim() !== "");
    if (!this.numRows && !this.numCols) {
      this.numRows = parseInt(lines[0].split("=")[1].trim());
      this.numCols = parseInt(lines[1].split("=")[1].trim());
      this.matrix = {};
    }
    for (let i = 2; i < lines.length; i++) {
      const parts = lines[i].trim().slice(1, -1).split(",");
      const row = parseInt(parts[0].trim());
      const col = parseInt(parts[1].trim());
      const value = parseInt(parts[2].trim());
      this.setElement(row, col, value);
    }
  }

  getElement(currRow, currCol) {
    return this.matrix[`${currRow},${currCol}`] || 0;
  }

  setElement(currRow, currCol, value) {
    if (value !== 0) {
      this.matrix[`${currRow},${currCol}`] = value;
    } else {
      delete this.matrix[`${currRow},${currCol}`];
    }
  }

  add(other) {
    if (this.numRows !== other.numRows || this.numCols !== other.numCols) {
      throw new Error("Matrices must have the same dimensions for addition.");
    }
    const result = new SparseMatrix(null, this.numRows, this.numCols);
    for (const [key, value] of Object.entries(this.matrix)) {
      const [row, col] = key.split(",").map(Number);
      result.setElement(row, col, value + other.getElement(row, col));
    }
    for (const [key, value] of Object.entries(other.matrix)) {
      const [row, col] = key.split(",").map(Number);
      if (!this.matrix.hasOwnProperty(key)) {
        result.setElement(row, col, value);
      }
    }
    return result;
  }

  subtract(other) {
    if (this.numRows !== other.numRows || this.numCols !== other.numCols) {
      throw new Error(
        "Matrices must have the same dimensions for subtraction."
      );
    }
    const result = new SparseMatrix(null, this.numRows, this.numCols);
    for (const [key, value] of Object.entries(this.matrix)) {
      const [row, col] = key.split(",").map(Number);
      result.setElement(row, col, value - other.getElement(row, col));
    }
    for (const [key, value] of Object.entries(other.matrix)) {
      const [row, col] = key.split(",").map(Number);
      if (!this.matrix.hasOwnProperty(key)) {
        result.setElement(row, col, -value);
      }
    }
    return result;
  }

  multiply(other) {
    if (this.numCols !== other.numRows) {
      throw new Error(
        "Number of columns in the first matrix must match the number of rows in the second matrix for multiplication."
      );
    }
    const result = new SparseMatrix(null, this.numRows, other.numCols);
    for (let i = 0; i < this.numRows; i++) {
      for (let j = 0; j < other.numCols; j++) {
        let dotProduct = 0;
        for (let k = 0; k < this.numCols; k++) {
          dotProduct += this.getElement(i, k) * other.getElement(k, j);
        }
        if (dotProduct !== 0) {
          result.setElement(i, j, dotProduct);
        }
      }
    }
    return result;
  }

  toString() {
    let result = `rows=${this.numRows}\ncols=${this.numCols}\n`;
    for (const [key, value] of Object.entries(this.matrix)) {
      const [row, col] = key.split(",").map(Number);
      result += `(${row},${col},${value})\n`;
    }
    return result;
  }
}

// Example usage:
const sampleInputsPath = path.join("Inputs");
const outputsPath = path.join("Outputs");

// Ensure the Outputs directory exists
if (!fs.existsSync(outputsPath)) {
  fs.mkdirSync(outputsPath);
}

try {
  const files = fs.readdirSync(sampleInputsPath);
  if (files.length === 0) {
    throw new Error("No files found in the Sample_inputs directory.");
  }

  files.forEach((file) => {
    const filePath = path.join(sampleInputsPath, file);
    const baseFileName = path.parse(file).name;

    // Load the sparse matrix from the current file
    const sparseMatrix1 = new SparseMatrix(filePath);

    // Create an empty matrix with the same dimensions for operations
    const sparseMatrix2 = new SparseMatrix(
      null,
      sparseMatrix1.numRows,
      sparseMatrix1.numCols
    );

    const resultAddition = sparseMatrix1.add(sparseMatrix2);
    const resultSubtraction = sparseMatrix1.subtract(sparseMatrix2);

    const additionResultPath = path.join(
      outputsPath,
      `${baseFileName}_additionResult.txt`
    );
    const subtractionResultPath = path.join(
      outputsPath,
      `${baseFileName}_subtractionResult.txt`
    );

    fs.writeFileSync(additionResultPath, resultAddition.toString());
    fs.writeFileSync(subtractionResultPath, resultSubtraction.toString());

    console.log(`Addition Result saved to ${additionResultPath}`);
    console.log(`Subtraction Result saved to ${subtractionResultPath}`);

    // Check if the matrices are suitable for multiplication
    if (sparseMatrix1.numCols === sparseMatrix2.numRows) {
      const resultMultiplication = sparseMatrix1.multiply(sparseMatrix2);
      const multiplicationResultPath = path.join(
        outputsPath,
        `${baseFileName}_multiplicationResult.txt`
      );
      fs.writeFileSync(
        multiplicationResultPath,
        resultMultiplication.toString()
      );
      console.log(`Multiplication Result saved to ${multiplicationResultPath}`);
    } else {
      console.log(
        `Skipping multiplication for ${file}. Number of columns in the first matrix does not match the number of rows in the second matrix.`
      );
    }
  });
} catch (error) {
  console.error(error.message);
}

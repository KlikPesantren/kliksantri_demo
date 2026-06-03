const pool = require("../db");

// ======================
// GET ALL
// ======================

exports.getAll = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT *
      FROM merchant_rfid
      ORDER BY id DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false
    });

  }
};

// ======================
// CREATE
// ======================

exports.create = async (req, res) => {

  try {

    const {
      nama_merchant
    } = req.body;

    const result =
      await pool.query(
        `
        INSERT INTO merchant_rfid
        (
          nama_merchant
        )
        VALUES
        (
          $1
        )
        RETURNING *
        `,
        [
          nama_merchant
        ]
      );

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false
    });

  }

};

// ======================
// UPDATE
// ======================

exports.update = async (req, res) => {

  try {

    const { id } = req.params;

    const {
      nama_merchant,
      status
    } = req.body;

    const result =
      await pool.query(
        `
        UPDATE merchant_rfid
        SET
          nama_merchant=$1,
          status=$2
        WHERE id=$3
        RETURNING *
        `,
        [
          nama_merchant,
          status,
          id
        ]
      );

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false
    });

  }

};

// ======================
// DELETE
// ======================

exports.remove = async (req, res) => {

  try {

    const { id } = req.params;

    await pool.query(
      `
      DELETE FROM merchant_rfid
      WHERE id=$1
      `,
      [id]
    );

    res.json({
      success: true
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false
    });

  }

};
"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, middleName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.middleName = middleName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** sets _note to an empty string if falsey value passed in. */
  set notes(note) {
    if (!note) {
      this._notes = "";
    } else {
      this._notes = note;
    }
  }

  /** gets _note. */
  get notes() {
    return this._notes;
  }

  /** Get full name of customer */

  get fullName() {
    if (!this.middleName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return `${this.firstName} ${this.middleName} ${this.lastName}`;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id,
              first_name AS "firstName",
              last_name  AS "lastName",
              phone,
              notes
      FROM customers
      ORDER BY last_name, first_name`
    );
    return results.rows.map((c) => new Customer(c));
  }

  /** Searches for customers based on keyword search */

  static async search(searchInput) {
    const results = await db.query(
      `SELECT id,
              first_name AS "firstName",
              middle_name AS "middleName",
              last_name  AS "lastName",
              phone,
              notes
      FROM customers
      WHERE CONCAT(first_name, ' ', middle_name, ' ', last_name) ILIKE $1
      ORDER BY last_name, first_name`,
      [`%${searchInput}%`]
    );
    return results.rows.map((c) => new Customer(c));
  }

  /** returns top ten customers by number of reservations */

  static async getTopTen() {
    const results = await db.query(
      `SELECT c.id,
              c.first_name AS "firstName",
              c.middle_name AS "middleName",
              c.last_name AS "lastName",
              c.phone,
              c.notes
      FROM customers AS c
        JOIN reservations as r
          ON c.id = r.customer_id
      GROUP BY c.id
      ORDER BY COUNT(c.id) DESC
      LIMIT 10`
    );
    return results.rows.map((c) => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
              first_name AS "firstName",
              middle_name AS "middleName",
              last_name  AS "lastName",
              phone,
              notes
      FROM customers
      WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
            VALUES ($1, $2, $3, $4)
            RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
            SET first_name=$1,
                middle_name=$2,
                last_name=$3,
                phone=$4,
                notes=$5
        WHERE id = $6`,
        [
          this.firstName,
          this.middleName,
          this.lastName,
          this.phone,
          this.notes,
          this.id,
        ]
      );
    }
  }
}

module.exports = Customer;

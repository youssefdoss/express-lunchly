"use strict";

/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");

const { BadRequestError } = require("../expressError");

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  /** Sets _customerId and ensures it cannot be reassigned. */
  set customerId(customerId) {
    if (this.customerId) {
      throw new BadRequestError(
        "You can't give your reservation to someone else."
      );
    } else {
      this._customerId = customerId;
    }
  }

  /** Gets _customerId. */
  get customerId() {
    return this._customerId;
  }

  /** Sets _numGuests and ensures it's greater than zero, otherwise throw an error.*/
  set numGuests(numGuests) {
    if (numGuests < 1) {
      throw new BadRequestError("Number of guests must be greater than 0.");
    } else {
      this._numGuests = numGuests;
    }
  }

  /** Gets _numGuests. */
  get numGuests() {
    return this._numGuests;
  }

  /** Sets _startAt and ensures a date object is passed in, otherwise throws an error. */
  set startAt(startAt) {
    if (!(startAt instanceof Date)) {
      throw new BadRequestError("You must enter a valid date.");
    } else {
      this._startAt = startAt;
    }
  }

  /** Gets _startAt */
  get startAt() {
    return this._startAt;
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

  /** formatter for startAt */

  getFormattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id,
              customer_id AS "customerId",
              num_guests AS "numGuests",
              start_at AS "startAt",
              notes AS "notes"
        FROM reservations
        WHERE customer_id = $1`,
      [customerId]
    );

    return results.rows.map((row) => new Reservation(row));
  }

  /** save this reservation. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, num_guests, start_at, notes)
               VALUES ($1, $2, $3, $4)
               RETURNING id`,
        [this.customerId, this.numGuests, this.startAt, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE reservations
               SET num_guests=$1,
                   start_at=$2,
                   notes=$3
               WHERE id = $4`,
        [this.numGuests, this.startAt, this.notes, this.id]
      );
    }
  }
}

module.exports = Reservation;

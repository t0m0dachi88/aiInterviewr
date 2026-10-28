import mongoose from "mongoose";

/**
 * Run work inside a MongoDB transaction (requires a replica set, including Atlas).
 *
 * @template T
 * @param {(session: import('mongoose').ClientSession) => Promise<T>} work
 * @returns {Promise<T>}
 */
export async function withTransaction(work) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (err) {
    if (
      err?.message?.includes(
        "Transaction numbers are only allowed on a replica set member or mongos",
      ) ||
      err?.code === 20 ||
      err?.codeName === "IllegalOperation"
    ) {
      return await work(session);
    }
    throw err;
  } finally {
    await session.endSession();
  }
}

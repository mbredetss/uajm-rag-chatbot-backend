import pool from "../../../utils/database.js";
import PostgresDocstore from "./PostgresDocStore.js";

const docStore = new PostgresDocstore(pool);

export default docStore;
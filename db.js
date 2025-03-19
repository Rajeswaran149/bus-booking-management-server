const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL; 
const supabaseKey = process.env.SUPABASE_ANON_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);


async function getUsers() {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
        console.error(error);
    } else {
        console.log(data);
    }
}

getUsers();

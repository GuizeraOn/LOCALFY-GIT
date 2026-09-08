require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
    
  console.log("Error:", error);
  console.log("Recent Sales:");
  data?.forEach(d => console.log(`${d.transaction_id} | ${d.status} | Price: ${d.price} ${d.currency} | Net: ${d.net_revenue} | Date: ${d.created_at}`));
}

check();

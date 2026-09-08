const token = 'H4sIAAAAAAAAAA3M27ZjMAAA0C86s%2BpaHlMxGkVSCcVLV5CqO1Ot8vVz3vfaYnOfuVPUuHZptCMpqNELDaFWWEhH7ZTElmv%2BEZvbiTOocWMrGFYahpEcMPBC%2FXTg9Bc2YPcbsGUw3bybL6VyugSOW2f0oAZN2Hvs1PkwbtKbrQSw7Pz6N%2B2LHU42HsH3jWft8U89lZ%2FZx4%2FrOZb33vTEcJTL%2BcYGrKj7ORI5OX2acbQDvTW0bZhvF7B%2BB2fjladf6Bt8YpcN8voko%2B3yeScNoQtG14pXvLXcxmdOGYsoN8bCkL6ttrAUGECdlZyN1vgspo9UkrAouGV4l1ayIPWEifjELjrCkSr0cGPvcC73l7qZNH5VJ5av9CXTpd38dwM5kZzjuPB6xudojNR8pyxXfI08f%2B50O2EhUdjuFkEWSKzDrLT2kf1N0KETx3BxXMA9cNc%2FBsxyuR9T1D2ucGpJ8Y35QdjraphpNRfGRIgY7CQpMtoawzW0HndpzX6SFdpwMafm%2Bh8yh0E00AEAAA%3D%3D';

async function run() {
  const endDateMs = Date.now();
  const startDateMs = endDateMs - 7 * 24 * 60 * 60 * 1000;
  const url = `https://developers.hotmart.com/payments/api/v1/sales/history?max_results=50&start_date=${startDateMs}&end_date=${endDateMs}`;
  
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  
  const foreignSales = data.items.filter(i => i.purchase?.price?.currency_code && i.purchase.price.currency_code !== 'BRL');
  console.log(`Found ${foreignSales.length} foreign sales out of ${data.items.length}`);
  
  if (foreignSales.length > 0) {
    const sale = foreignSales[0];
    console.log(JSON.stringify(sale.purchase, null, 2));
    console.log("Commissions:", JSON.stringify(sale.purchase.commissions || sale.commissions, null, 2));
  } else if (data.items.length > 0) {
    console.log(JSON.stringify(data.items[0].purchase, null, 2));
  }
}
run();

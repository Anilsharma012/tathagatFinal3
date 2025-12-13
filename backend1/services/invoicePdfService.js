const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

handlebars.registerHelper('formatCurrency', function(value) {
  if (value === undefined || value === null) return '-';
  return '₹' + Number(value).toLocaleString('en-IN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
});

const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  
  const convertLessThanThousand = (n) => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  };
  
  const intPart = Math.floor(num);
  const decimalPart = Math.round((num - intPart) * 100);
  
  let result = '';
  
  if (intPart >= 10000000) {
    result += convertLessThanThousand(Math.floor(intPart / 10000000)) + ' Crore ';
    num = intPart % 10000000;
  } else {
    num = intPart;
  }
  
  if (num >= 100000) {
    result += convertLessThanThousand(Math.floor(num / 100000)) + ' Lakh ';
    num = num % 100000;
  }
  
  if (num >= 1000) {
    result += convertLessThanThousand(Math.floor(num / 1000)) + ' Thousand ';
    num = num % 1000;
  }
  
  if (num > 0) {
    result += convertLessThanThousand(num);
  }
  
  result = result.trim() + ' Rupees';
  
  if (decimalPart > 0) {
    result += ' and ' + convertLessThanThousand(decimalPart) + ' Paise';
  }
  
  return result + ' Only';
};

const generateInvoiceNumber = (prefix, paymentId, date) => {
  const d = new Date(date);
  const year = d.getFullYear().toString().slice(-2);
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const shortId = paymentId.toString().slice(-6).toUpperCase();
  return `${prefix}${year}${month}-${shortId}`;
};

const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const prepareInvoiceData = (payment, user, course, billingSettings) => {
  const amountInRupees = payment.amount / 100;
  const originalAmount = payment.originalAmount ? payment.originalAmount / 100 : amountInRupees;
  const discountAmount = payment.discountAmount ? payment.discountAmount / 100 : 0;
  
  const cgstRate = billingSettings.taxSettings?.cgstRate || 9;
  const sgstRate = billingSettings.taxSettings?.sgstRate || 9;
  const igstRate = billingSettings.taxSettings?.igstRate || 18;
  
  const centreState = (billingSettings.centreDetails?.state || '').toLowerCase().trim();
  const customerState = (user.state || '').toLowerCase().trim();
  const isInterstate = customerState && centreState && customerState !== centreState;
  
  const totalTaxRate = isInterstate ? igstRate : (cgstRate + sgstRate);
  const taxableValue = amountInRupees / (1 + totalTaxRate / 100);
  
  let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;
  if (isInterstate) {
    igstAmount = taxableValue * (igstRate / 100);
  } else {
    cgstAmount = taxableValue * (cgstRate / 100);
    sgstAmount = taxableValue * (sgstRate / 100);
  }
  
  const invoiceNumber = generateInvoiceNumber(
    billingSettings.invoicePrefix || 'STX',
    payment.razorpay_payment_id || payment._id.toString(),
    payment.createdAt
  );
  
  const item = {
    serialNo: 1,
    description: course.name || 'Course Enrollment',
    hsnCode: billingSettings.taxSettings?.defaultHsnCode || '999293',
    baseFee: originalAmount,
    discount: discountAmount,
    taxableValue: taxableValue,
    cgstRate: isInterstate ? 0 : cgstRate,
    cgstAmount: cgstAmount,
    sgstRate: isInterstate ? 0 : sgstRate,
    sgstAmount: sgstAmount,
    igstRate: isInterstate ? igstRate : 0,
    igstAmount: igstAmount,
    totalFee: amountInRupees
  };
  
  const address = billingSettings.address || {};
  const centre = billingSettings.centreDetails || {};
  const signatory = billingSettings.authorizedSignatory || {};
  const bank = billingSettings.bankDetails || {};
  
  const registeredAddress = [
    address.street,
    address.city,
    address.state,
    address.pincode,
    address.country
  ].filter(Boolean).join(', ');
  
  return {
    companyName: billingSettings.companyName || 'Tathagat Education',
    companyLogo: billingSettings.companyLogo || '',
    companyPhone: billingSettings.phone || '',
    companyGstin: billingSettings.gstNumber || '',
    
    invoiceNumber: invoiceNumber,
    invoiceDate: formatDate(payment.createdAt),
    
    studentCode: user._id.toString().slice(-8).toUpperCase(),
    studentName: user.name || user.fullName || 'Student',
    studentEmail: user.email || '',
    studentPhone: user.phone || user.mobile || '',
    studentAddress: user.address || '',
    studentState: user.state || 'Delhi',
    studentGstin: user.gstin || '',
    
    centreName: centre.name || billingSettings.companyName || 'Main Centre',
    centreAddress: centre.address || address.street || '',
    centreCity: centre.city || address.city || '',
    centreState: centre.state || address.state || 'Delhi',
    centreStateCode: centre.stateCode || '07',
    
    items: [item],
    
    isInterstate: isInterstate,
    subtotalBaseFee: originalAmount,
    subtotalDiscount: discountAmount,
    subtotalTaxable: taxableValue,
    subtotalCgst: cgstAmount,
    subtotalSgst: sgstAmount,
    subtotalIgst: igstAmount,
    subtotalTotal: amountInRupees,
    
    adjustmentAmount: 0,
    totalReceived: amountInRupees,
    amountInWords: numberToWords(amountInRupees),
    
    paymentMode: payment.paymentMethod === 'razorpay' ? 'Razorpay' : 
                 payment.paymentMethod === 'offline' ? 'Offline' : 'Online',
    paymentReference: payment.razorpay_payment_id || payment.receiptNumber || payment._id.toString(),
    paymentDate: formatDate(payment.createdAt),
    
    bankName: bank.bankName || '',
    accountNumber: bank.accountNumber || '',
    ifscCode: bank.ifscCode || '',
    
    termsAndConditions: billingSettings.termsAndConditions || '',
    footerNote: billingSettings.footerNote || '',
    
    signatureImage: signatory.signatureImage || '',
    signatoryName: signatory.name || '',
    signatoryDesignation: signatory.designation || '',
    
    panNumber: billingSettings.panNumber || '',
    cinNumber: billingSettings.cinNumber || '',
    registeredAddress: registeredAddress
  };
};

const generateInvoicePdf = async (invoiceData) => {
  const templatePath = path.join(__dirname, '../templates/taxInvoice.hbs');
  const templateSource = fs.readFileSync(templatePath, 'utf8');
  const template = handlebars.compile(templateSource);
  const html = template(invoiceData);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    });
    
    return pdfBuffer;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = {
  prepareInvoiceData,
  generateInvoicePdf,
  generateInvoiceNumber,
  numberToWords
};

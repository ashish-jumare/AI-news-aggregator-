import { useState } from 'react';

const COMPANIES = [
  { id: 'abb', name: 'ABB India Ltd.', icon: '⚡', color: 'bg-red-600', logo: 'https://logo.clearbit.com/abb.com' },
  { id: 'adaniensol', name: 'Adani Energy Solutions Ltd.', icon: '🔋', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/adani.com' },
  { id: 'adanient', name: 'Adani Enterprises Ltd.', icon: '🏭', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/adani.com' },
  { id: 'adanigreen', name: 'Adani Green Energy Ltd.', icon: '🌱', color: 'bg-green-600', logo: 'https://logo.clearbit.com/adanigreenenergy.com' },
  { id: 'adaniports', name: 'Adani Ports and Special Economic Zone Ltd.', icon: '⚓', color: 'bg-blue-700', logo: 'https://logo.clearbit.com/adaniports.com' },
  { id: 'adanipower', name: 'Adani Power Ltd.', icon: '⚡', color: 'bg-orange-600', logo: 'https://logo.clearbit.com/adanipower.com' },
  { id: 'ambujacem', name: 'Ambuja Cements Ltd.', icon: '🏗️', color: 'bg-gray-600', logo: 'https://logo.clearbit.com/ambujacements.com' },
  { id: 'apollohosp', name: 'Apollo Hospitals Enterprise Ltd.', icon: '🏥', color: 'bg-red-500', logo: 'https://logo.clearbit.com/apollohospitals.com' },
  { id: 'asianpaint', name: 'Asian Paints Ltd.', icon: '🎨', color: 'bg-red-600', logo: 'https://logo.clearbit.com/asianpaints.com' },
  { id: 'dmart', name: 'Avenue Supermarts Ltd.', icon: '🛒', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/dmartindia.com' },
  { id: 'axisbank', name: 'Axis Bank Ltd.', icon: '🏦', color: 'bg-red-700', logo: 'https://logo.clearbit.com/axisbank.com' },
  { id: 'bajajauto', name: 'Bajaj Auto Ltd.', icon: '🏍️', color: 'bg-blue-800', logo: 'https://logo.clearbit.com/bajajauto.com' },
  { id: 'bajfinance', name: 'Bajaj Finance Ltd.', icon: '💰', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/bajajfinserv.in' },
  { id: 'bajajfinsv', name: 'Bajaj Finserv Ltd.', icon: '💼', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/bajajfinserv.in' },
  { id: 'bajajhldng', name: 'Bajaj Holdings & Investment Ltd.', icon: '🏢', color: 'bg-blue-700', logo: 'https://logo.clearbit.com/bajajholdings.in' },
  { id: 'bajajhfl', name: 'Bajaj Housing Finance Ltd.', icon: '🏠', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/bajajhousingfinance.in' },
  { id: 'bankbaroda', name: 'Bank of Baroda', icon: '🏦', color: 'bg-orange-600', logo: 'https://logo.clearbit.com/bankofbaroda.in' },
  { id: 'bel', name: 'Bharat Electronics Ltd.', icon: '📡', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/bel-india.in' },
  { id: 'bpcl', name: 'Bharat Petroleum Corporation Ltd.', icon: '⛽', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/bharatpetroleum.in' },
  { id: 'bhartiartl', name: 'Bharti Airtel Ltd.', icon: '📱', color: 'bg-red-600', logo: 'https://logo.clearbit.com/airtel.in' },
  { id: 'boschltd', name: 'Bosch Ltd.', icon: '🔧', color: 'bg-red-700', logo: 'https://logo.clearbit.com/bosch.com' },
  { id: 'britannia', name: 'Britannia Industries Ltd.', icon: '🍪', color: 'bg-red-600', logo: 'https://logo.clearbit.com/britannia.co.in' },
  { id: 'cgpower', name: 'CG Power and Industrial Solutions Ltd.', icon: '⚡', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/cgpower.com' },
  { id: 'canbk', name: 'Canara Bank', icon: '🏦', color: 'bg-orange-600', logo: 'https://logo.clearbit.com/canarabank.com' },
  { id: 'cholafin', name: 'Cholamandalam Investment and Finance Company Ltd.', icon: '💰', color: 'bg-red-600', logo: 'https://logo.clearbit.com/cholamandalam.com' },
  { id: 'cipla', name: 'Cipla Ltd.', icon: '💊', color: 'bg-red-600', logo: 'https://logo.clearbit.com/cipla.com' },
  { id: 'coalindia', name: 'Coal India Ltd.', icon: '⛏️', color: 'bg-gray-700', logo: 'https://logo.clearbit.com/coalindia.in' },
  { id: 'dlf', name: 'DLF Ltd.', icon: '🏗️', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/dlf.in' },
  { id: 'divislab', name: "Divi's Laboratories Ltd.", icon: '🧪', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/divislabs.com' },
  { id: 'drreddy', name: "Dr. Reddy's Laboratories Ltd.", icon: '💊', color: 'bg-red-600', logo: 'https://logo.clearbit.com/drreddys.com' },
  { id: 'eichermot', name: 'Eicher Motors Ltd.', icon: '🏍️', color: 'bg-red-700', logo: 'https://logo.clearbit.com/eichermotors.com' },
  { id: 'eternal', name: 'Eternal Ltd.', icon: '🏢', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/eternalgroup.in' },
  { id: 'gail', name: 'GAIL (India) Ltd.', icon: '🔥', color: 'bg-red-600', logo: 'https://logo.clearbit.com/gailonline.com' },
  { id: 'godrejcp', name: 'Godrej Consumer Products Ltd.', icon: '🧴', color: 'bg-red-600', logo: 'https://logo.clearbit.com/godrejcp.com' },
  { id: 'grasim', name: 'Grasim Industries Ltd.', icon: '🏭', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/grasim.com' },
  { id: 'hcltech', name: 'HCL Technologies Ltd.', icon: '💻', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/hcltech.com' },
  { id: 'hdfcbank', name: 'HDFC Bank Ltd.', icon: '🏦', color: 'bg-blue-800', logo: 'https://logo.clearbit.com/hdfcbank.com' },
  { id: 'hdfclife', name: 'HDFC Life Insurance Company Ltd.', icon: '🛡️', color: 'bg-red-600', logo: 'https://logo.clearbit.com/hdfclife.com' },
  { id: 'havells', name: 'Havells India Ltd.', icon: '💡', color: 'bg-red-600', logo: 'https://logo.clearbit.com/havells.com' },
  { id: 'hindalco', name: 'Hindalco Industries Ltd.', icon: '🏭', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/hindalco.com' },
  { id: 'hal', name: 'Hindustan Aeronautics Ltd.', icon: '✈️', color: 'bg-blue-700', logo: 'https://logo.clearbit.com/hal-india.co.in' },
  { id: 'hindunilvr', name: 'Hindustan Unilever Ltd.', icon: '🧴', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/hul.co.in' },
  { id: 'hindzinc', name: 'Hindustan Zinc Ltd.', icon: '⛏️', color: 'bg-gray-600', logo: 'https://logo.clearbit.com/hzlindia.com' },
  { id: 'hyundai', name: 'Hyundai Motor India Ltd.', icon: '🚗', color: 'bg-blue-700', logo: 'https://logo.clearbit.com/hyundai.com' },
  { id: 'icicibank', name: 'ICICI Bank Ltd.', icon: '🏦', color: 'bg-orange-600', logo: 'https://logo.clearbit.com/icicibank.com' },
  { id: 'icicigi', name: 'ICICI Lombard General Insurance Company Ltd.', icon: '🛡️', color: 'bg-orange-600', logo: 'https://logo.clearbit.com/icicilombard.com' },
  { id: 'itc', name: 'ITC Ltd.', icon: '🏢', color: 'bg-yellow-600', logo: 'https://logo.clearbit.com/itcportal.com' },
  { id: 'indhotel', name: 'Indian Hotels Co. Ltd.', icon: '🏨', color: 'bg-red-600', logo: 'https://logo.clearbit.com/tajhotels.com' },
  { id: 'ioc', name: 'Indian Oil Corporation Ltd.', icon: '⛽', color: 'bg-red-600', logo: 'https://logo.clearbit.com/iocl.com' },
  { id: 'irfc', name: 'Indian Railway Finance Corporation Ltd.', icon: '🚂', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/irfc.co.in' },
  { id: 'naukri', name: 'Info Edge (India) Ltd.', icon: '💼', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/naukri.com' },
  { id: 'infy', name: 'Infosys Ltd.', icon: '💻', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/infosys.com' },
  { id: 'indigo', name: 'InterGlobe Aviation Ltd.', icon: '✈️', color: 'bg-blue-700', logo: 'https://logo.clearbit.com/goindigo.in' },
  { id: 'jswenergy', name: 'JSW Energy Ltd.', icon: '⚡', color: 'bg-green-600', logo: 'https://logo.clearbit.com/jsw.in' },
  { id: 'jswsteel', name: 'JSW Steel Ltd.', icon: '🏭', color: 'bg-blue-700', logo: 'https://logo.clearbit.com/jsw.in' },
  { id: 'jindalstel', name: 'Jindal Steel Ltd.', icon: '🏭', color: 'bg-red-600', logo: 'https://logo.clearbit.com/jindalsteelpower.com' },
  { id: 'jiofin', name: 'Jio Financial Services Ltd.', icon: '💰', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/jio.com' },
  { id: 'kotakbank', name: 'Kotak Mahindra Bank Ltd.', icon: '🏦', color: 'bg-red-700', logo: 'https://logo.clearbit.com/kotak.com' },
  { id: 'ltim', name: 'LTIMindtree Ltd.', icon: '💻', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/ltimindtree.com' },
  { id: 'lt', name: 'Larsen & Toubro Ltd.', icon: '🏗️', color: 'bg-blue-700', logo: 'https://logo.clearbit.com/larsentoubro.com' },
  { id: 'lici', name: 'Life Insurance Corporation of India', icon: '🛡️', color: 'bg-orange-600', logo: 'https://logo.clearbit.com/licindia.in' },
  { id: 'lodha', name: 'Lodha Developers Ltd.', icon: '🏗️', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/lodhagroup.in' },
  { id: 'mm', name: 'Mahindra & Mahindra Ltd.', icon: '🚗', color: 'bg-red-700', logo: 'https://logo.clearbit.com/mahindra.com' },
  { id: 'maruti', name: 'Maruti Suzuki India Ltd.', icon: '🚗', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/marutisuzuki.com' },
  { id: 'maxhealth', name: 'Max Healthcare Institute Ltd.', icon: '🏥', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/maxhealthcare.in' },
  { id: 'mazdock', name: 'Mazagoan Dock Shipbuilders Ltd.', icon: '🚢', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/mazagondock.in' },
  { id: 'ntpc', name: 'NTPC Ltd.', icon: '⚡', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/ntpc.co.in' },
  { id: 'nestleind', name: 'Nestle India Ltd.', icon: '🍫', color: 'bg-blue-800', logo: 'https://logo.clearbit.com/nestle.in' },
  { id: 'ongc', name: 'Oil & Natural Gas Corporation Ltd.', icon: '🛢️', color: 'bg-red-600', logo: 'https://logo.clearbit.com/ongcindia.com' },
  { id: 'pidilitind', name: 'Pidilite Industries Ltd.', icon: '🧴', color: 'bg-red-600', logo: 'https://logo.clearbit.com/pidilite.com' },
  { id: 'pfc', name: 'Power Finance Corporation Ltd.', icon: '💰', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/pfcindia.com' },
  { id: 'powergrid', name: 'Power Grid Corporation of India Ltd.', icon: '⚡', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/powergridindia.com' },
  { id: 'pnb', name: 'Punjab National Bank', icon: '🏦', color: 'bg-blue-700', logo: 'https://logo.clearbit.com/pnbindia.in' },
  { id: 'recltd', name: 'REC Ltd.', icon: '💰', color: 'bg-green-600', logo: 'https://logo.clearbit.com/recindia.nic.in' },
  { id: 'reliance', name: 'Reliance Industries Ltd.', icon: '🏭', color: 'bg-blue-700', logo: 'https://logo.clearbit.com/ril.com' },
  { id: 'sbilife', name: 'SBI Life Insurance Company Ltd.', icon: '🛡️', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/sbilife.co.in' },
  { id: 'motherson', name: 'Samvardhana Motherson International Ltd.', icon: '🚗', color: 'bg-red-600', logo: 'https://logo.clearbit.com/motherson.com' },
  { id: 'shreecem', name: 'Shree Cement Ltd.', icon: '🏗️', color: 'bg-gray-600', logo: 'https://logo.clearbit.com/shreecement.com' },
  { id: 'shriramfin', name: 'Shriram Finance Ltd.', icon: '💰', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/shriramfinance.in' },
  { id: 'enrin', name: 'Siemens Energy India Ltd.', icon: '⚡', color: 'bg-teal-600', logo: 'https://logo.clearbit.com/siemens-energy.com' },
  { id: 'siemens', name: 'Siemens Ltd.', icon: '⚡', color: 'bg-teal-600', logo: 'https://logo.clearbit.com/siemens.com' },
  { id: 'solarinds', name: 'Solar Industries India Ltd.', icon: '💥', color: 'bg-orange-600', logo: 'https://logo.clearbit.com/solargroup.com' },
  { id: 'sbin', name: 'State Bank of India', icon: '🏦', color: 'bg-blue-700', logo: 'https://logo.clearbit.com/sbi.co.in' },
  { id: 'sunpharma', name: 'Sun Pharmaceutical Industries Ltd.', icon: '💊', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/sunpharma.com' },
  { id: 'tvsmotor', name: 'TVS Motor Company Ltd.', icon: '🏍️', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/tvsmotor.com' },
  { id: 'tcs', name: 'Tata Consultancy Services Ltd.', icon: '💻', color: 'bg-blue-700', logo: 'https://logo.clearbit.com/tcs.com' },
  { id: 'tataconsum', name: 'Tata Consumer Products Ltd.', icon: '☕', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/tataconsumer.com' },
  { id: 'tmpv', name: 'Tata Motors Passenger Vehicles Ltd.', icon: '🚗', color: 'bg-blue-700', logo: 'https://logo.clearbit.com/tatamotors.com' },
  { id: 'tatapower', name: 'Tata Power Co. Ltd.', icon: '⚡', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/tatapower.com' },
  { id: 'tatasteel', name: 'Tata Steel Ltd.', icon: '🏭', color: 'bg-blue-700', logo: 'https://logo.clearbit.com/tatasteel.com' },
  { id: 'techm', name: 'Tech Mahindra Ltd.', icon: '💻', color: 'bg-red-600', logo: 'https://logo.clearbit.com/techmahindra.com' },
  { id: 'titan', name: 'Titan Company Ltd.', icon: '⌚', color: 'bg-yellow-600', logo: 'https://logo.clearbit.com/titan.co.in' },
  { id: 'torntpharm', name: 'Torrent Pharmaceuticals Ltd.', icon: '💊', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/torrentpharma.com' },
  { id: 'trent', name: 'Trent Ltd.', icon: '🛍️', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/trent-tata.com' },
  { id: 'ultracemco', name: 'UltraTech Cement Ltd.', icon: '🏗️', color: 'bg-gray-700', logo: 'https://logo.clearbit.com/ultratechcement.com' },
  { id: 'unitdspr', name: 'United Spirits Ltd.', icon: '🥃', color: 'bg-red-600', logo: 'https://logo.clearbit.com/unitedspirits.in' },
  { id: 'vbl', name: 'Varun Beverages Ltd.', icon: '🥤', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/varunbeverages.com' },
  { id: 'vedl', name: 'Vedanta Ltd.', icon: '⛏️', color: 'bg-red-700', logo: 'https://logo.clearbit.com/vedantalimited.com' },
  { id: 'wipro', name: 'Wipro Ltd.', icon: '💻', color: 'bg-orange-500', logo: 'https://logo.clearbit.com/wipro.com' },
  { id: 'zyduslife', name: 'Zydus Lifesciences Ltd.', icon: '💊', color: 'bg-blue-600', logo: 'https://logo.clearbit.com/zyduslife.com' },
];

export default function Sidebar({ selectedCompany, onSelectCompany, filterDays, onFilterChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Filter companies based on search query
  const filteredCompanies = COMPANIES.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle custom date apply
  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      onFilterChange(diffDays);
      setShowCustomDate(false);
    }
  };

  // Handle filter change
  const handleFilterChange = (value) => {
    if (value === 'custom') {
      setShowCustomDate(true);
    } else {
      setShowCustomDate(false);
      onFilterChange(Number(value));
    }
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 transition-colors duration-300 flex flex-col h-full">
      <div className="flex-shrink-0 p-5 pb-3">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            Insight News
        </h1>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-5">
          Real-time NIFTY 100 company updates
        </p>

        {/* Search Box */}
        <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center">
            <svg 
              className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search NIFTY 100 companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-xs text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Time Filter Dropdown */}
        <div className="mb-3">
          <select
            value={filterDays}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="w-full p-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value={0}>All Time</option>
            <option value={30}>Last 1 Month</option>
            <option value={90}>Last 3 Months</option>
            <option value={180}>Last 6 Months</option>
            <option value={365}>Last 1 Year</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>

        {/* Custom Date Picker */}
        {showCustomDate && (
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">Select Date Range</p>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-gray-600 dark:text-gray-400 mb-1 block">From Date:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full p-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-600 dark:text-gray-400 mb-1 block">To Date:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  min={customStartDate}
                  className="w-full p-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleCustomDateApply}
                  disabled={!customStartDate || !customEndDate}
                  className="flex-1 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                >
                  Apply
                </button>
                <button
                  onClick={() => {
                    setShowCustomDate(false);
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="flex-1 px-3 py-1.5 text-xs font-semibold bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Divider Line */}
        <hr className="border-t border-gray-200 dark:border-gray-600" />
      </div>

      {/* Scrollable Company List */}
      <div className="flex-1 overflow-y-auto px-5">
        <div className="space-y-2 pb-4">
          {filteredCompanies.length > 0 ? (
            filteredCompanies.map((company) => (
              <button
                key={company.id}
                onClick={() => onSelectCompany(company.name)}
                className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
                  selectedCompany === company.name
                    ? 'bg-blue-600 text-white shadow-md transform scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow'
                }`}
              >
                <div className="w-6 h-6 mr-2.5 flex items-center justify-center bg-white rounded-md p-1">
                  <img 
                    src={company.logo} 
                    alt={`${company.name} logo`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <span className="text-xl hidden">{company.icon}</span>
                </div>
                <span className="font-semibold text-xs">{company.name}</span>
              </button>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-xs text-gray-500 dark:text-gray-400">No companies found</p>
            </div>
          )}
        </div>
      </div>

    </aside>
  );
}

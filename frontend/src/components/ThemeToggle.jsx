import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import SettingsModal from './SettingsModal';

export default function ThemeToggle({ newsData = [], selectedCompany, onOpenDashboard, onOpenNewsFeed, onOpenTwitterFeed, onOpenBookmarks, onOpenHelp, onOpenFeedback, onSettingsChange, onGoHome, currentView }) {
  const { isDark, toggleTheme } = useTheme();
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [reportFilterDays, setReportFilterDays] = useState(0); // 0 = All time
  const [showCustomReportDate, setShowCustomReportDate] = useState(false);
  const [customReportStartDate, setCustomReportStartDate] = useState('');
  const [customReportEndDate, setCustomReportEndDate] = useState('');

  // Sanitize text for PDF to prevent encoding issues
  const sanitizeTextForPDF = (text) => {
    if (!text) return '';
    return text
      .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  // Filter news based on selected time period
  const getFilteredNews = () => {
    if (reportFilterDays === 0) return newsData; // All time
    const filterTime = new Date(Date.now() - reportFilterDays * 24 * 60 * 60 * 1000);
    return newsData.filter(article => {
      const publishedDate = new Date(article.publishedAt);
      return publishedDate >= filterTime;
    });
  };

  const getTimeRangeLabel = () => {
    if (reportFilterDays === 0) return 'All Time';
    if (reportFilterDays === 30) return 'Last 1 Month';
    if (reportFilterDays === 90) return 'Last 3 Months';
    if (reportFilterDays === 180) return 'Last 6 Months';
    if (reportFilterDays === 365) return 'Last 1 Year';
    return `Last ${reportFilterDays} Days`;
  };

  // Handle custom date apply for reports
  const handleCustomReportDateApply = () => {
    if (customReportStartDate && customReportEndDate) {
      const start = new Date(customReportStartDate);
      const end = new Date(customReportEndDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setReportFilterDays(diffDays);
      setShowCustomReportDate(false);
    }
  };

  // Handle report filter change
  const handleReportFilterChange = (value) => {
    if (value === 'custom') {
      setShowCustomReportDate(true);
    } else {
      setShowCustomReportDate(false);
      setReportFilterDays(Number(value));
    }
  };

  // Generate smart summary from title and description with enriched context
  const generateSummary = (title, description, article) => {
    let summary = '';
    
    if (description && description !== title && description.trim().length > 20) {
      // Remove any content that's exactly the same as title
      const cleanDesc = description.replace(title, '').trim();
      
      if (cleanDesc.length > 20) {
        // Extract meaningful sentences
        const sentences = cleanDesc
          .replace(/\s+/g, ' ')
          .trim()
          .split(/[.!?]+/)
          .filter(s => s.trim().length > 20)
          .slice(0, 6);
        
        summary = sentences.join('. ').trim();
        if (summary && !summary.endsWith('.')) {
          summary += '.';
        }
      }
    }
    
    // If summary is short, enrich with article metadata and context
    if ((!summary || summary.length < 200) && article) {
      const contextInfo = [];
      
      // Add source credibility
      if (article.source) {
        contextInfo.push(`Reported by ${article.source}`);
      }
      
      // Add timing context
      if (article.publishedAt) {
        const hoursAgo = Math.floor((Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60));
        if (hoursAgo < 1) {
          contextInfo.push('Breaking news from the last hour');
        } else if (hoursAgo < 6) {
          contextInfo.push(`Recent update from ${hoursAgo} hours ago`);
        } else {
          contextInfo.push(`Published ${hoursAgo} hours ago`);
        }
      }
      
      // Add sentiment insights
      if (article.sentiment) {
        const sentimentContext = {
          'positive': 'Indicates positive market sentiment and potential growth opportunities',
          'negative': 'Suggests market concerns and potential risks for investors',
          'neutral': 'Presents balanced market outlook with mixed implications'
        };
        contextInfo.push(sentimentContext[article.sentiment] || 'Market impact assessment pending');
      }
      
      // Auto-categorize based on title keywords
      const titleLower = title.toLowerCase();
      const categories = [
        { keywords: ['earnings', 'profit', 'revenue', 'quarterly'], label: 'Earnings Report - Financial performance analysis' },
        { keywords: ['merger', 'acquisition', 'acquire', 'buy'], label: 'M&A Activity - Corporate restructuring news' },
        { keywords: ['lawsuit', 'legal', 'court', 'settlement'], label: 'Legal Development - Regulatory or litigation matter' },
        { keywords: ['partnership', 'collaborate', 'alliance'], label: 'Strategic Partnership - Business expansion initiative' },
        { keywords: ['launch', 'unveil', 'introduce', 'release'], label: 'Product/Service Launch - Innovation announcement' },
        { keywords: ['shares', 'stock', 'trading', 'price'], label: 'Stock Movement - Market trading activity' },
        { keywords: ['ceo', 'executive', 'appoint', 'resign'], label: 'Executive News - Leadership changes' },
        { keywords: ['dividend', 'buyback', 'split'], label: 'Shareholder Action - Capital allocation decision' }
      ];
      
      for (const category of categories) {
        if (category.keywords.some(kw => titleLower.includes(kw))) {
          contextInfo.push(category.label);
          break;
        }
      }
      
      // Combine original summary with enriched context
      if (contextInfo.length > 0) {
        summary = summary || title;
        summary += ' | Additional Context: ' + contextInfo.join('. ') + '.';
      }
    }
    
    // Final fallback with title baseline
    if (!summary || summary.length < 50) {
      summary = `${title} - Full article available at source URL. This news item contains detailed information relevant to market analysis and investment decisions.`;
    }
    
    return summary;
  };

  // Extract key points from news
  const extractKeyPoints = (article) => {
    const keyPoints = [];
    const text = `${article.title} ${article.description || ''}`.toLowerCase();
    
    if (text.match(/\d+%|\$\d+|profit|revenue|earnings|sales/)) {
      const numbers = text.match(/\d+\.?\d*%?|\$\d+\.?\d*[bmk]?/gi);
      if (numbers) keyPoints.push(`📊 ${numbers.slice(0, 2).join(', ')}`);
    }
    
    if (text.match(/announce|launch|release|unveil|introduce/)) {
      keyPoints.push('🚀 New announcement');
    }
    if (text.match(/lawsuit|sue|legal|court|settlement/)) {
      keyPoints.push('⚖️ Legal matter');
    }
    if (text.match(/acquire|merger|acquisition|buy|purchase/)) {
      keyPoints.push('🤝 M&A activity');
    }
    if (text.match(/partnership|partner|collaborate|alliance/)) {
      keyPoints.push('🤝 Partnership');
    }
    
    return keyPoints.length > 0 ? keyPoints.join(' | ') : 'General news';
  };

  const handleDownloadPDF = () => {
    const filteredNews = getFilteredNews();
    
    if (filteredNews.length === 0) {
      alert(`No news available from the ${getTimeRangeLabel().toLowerCase()}`);
      setShowReportMenu(false);
      return;
    }

    const last24HNews = filteredNews; // Keep variable name for compatibility

    const doc = new jsPDF();
    
    // Set default font to Helvetica for proper text rendering
    doc.setFont('helvetica', 'normal');
    
    // Cover Page
    doc.setFontSize(24);
    doc.setTextColor(40);
    const reportTitle = sanitizeTextForPDF((selectedCompany || 'Company') + ' News Report');
    doc.text(reportTitle, 14, 30);
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    const reportSubtitle = sanitizeTextForPDF(getTimeRangeLabel() + ' Summary Report');
    doc.text(reportSubtitle, 14, 42);
    
    doc.setFontSize(11);
    doc.text('Generated: ' + new Date().toLocaleString(), 14, 52);
    doc.text('Total Articles: ' + last24HNews.length, 14, 60);
    
    // Add summary statistics
    const positive = last24HNews.filter(a => a.sentiment === 'positive').length;
    const negative = last24HNews.filter(a => a.sentiment === 'negative').length;
    const neutral = last24HNews.length - positive - negative;
    
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text('Sentiment Overview:', 14, 75);
    doc.setFontSize(10);
    doc.setTextColor(34, 197, 94);
    doc.text('Positive: ' + positive + ' (' + Math.round(positive/last24HNews.length*100) + '%)', 20, 83);
    doc.setTextColor(107, 114, 128);
    doc.text('Neutral: ' + neutral + ' (' + Math.round(neutral/last24HNews.length*100) + '%)', 20, 91);
    doc.setTextColor(239, 68, 68);
    doc.text('Negative: ' + negative + ' (' + Math.round(negative/last24HNews.length*100) + '%)', 20, 99);
    
    // Overall Market Sentiment
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text('Overall Market Sentiment:', 14, 112);
    doc.setFontSize(10);
    const overallSentiment = positive > negative ? 'BULLISH' : 
                            positive < negative ? 'BEARISH' : 'NEUTRAL';
    const sentimentColor = positive > negative ? [34, 197, 94] : 
                          positive < negative ? [239, 68, 68] : [107, 114, 128];
    doc.setTextColor(...sentimentColor);
    doc.text(overallSentiment, 20, 120);
    
    // Key Highlights Summary
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text('Key Highlights (' + getTimeRangeLabel() + '):', 14, 135);
    doc.setFontSize(9);
    doc.setTextColor(60);
    
    // Count different types of news
    const announcements = last24HNews.filter(a => 
      extractKeyPoints(a).includes('New announcement')).length;
    const legal = last24HNews.filter(a => 
      extractKeyPoints(a).includes('Legal matter')).length;
    const mna = last24HNews.filter(a => 
      extractKeyPoints(a).includes('M&A activity')).length;
    const partnerships = last24HNews.filter(a => 
      extractKeyPoints(a).includes('Partnership')).length;
    
    let highlightY = 143;
    if (announcements > 0) {
      doc.text(announcements + ' New Announcements', 20, highlightY);
      highlightY += 7;
    }
    if (legal > 0) {
      doc.text(legal + ' Legal Developments', 20, highlightY);
      highlightY += 7;
    }
    if (mna > 0) {
      doc.text(mna + ' M&A Activities', 20, highlightY);
      highlightY += 7;
    }
    if (partnerships > 0) {
      doc.text(partnerships + ' Partnership Announcements', 20, highlightY);
      highlightY += 7;
    }
    
    // Top Sources
    const sources = {};
    last24HNews.forEach(a => {
      const source = a.source?.name || a.source || 'Unknown';
      sources[source] = (sources[source] || 0) + 1;
    });
    const topSources = Object.entries(sources)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text('Top News Sources:', 14, highlightY + 8);
    doc.setFontSize(9);
    doc.setTextColor(60);
    topSources.forEach(([source, count], idx) => {
      const sanitizedSource = sanitizeTextForPDF(source);
      doc.text((idx + 1) + '. ' + sanitizedSource + ' (' + count + ' articles)', 20, highlightY + 16 + (idx * 7));
    });
    
    // Executive Summary
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text('Executive Summary', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(60);
    const execSummary = sanitizeTextForPDF(
      'In the ' + getTimeRangeLabel().toLowerCase() + ', ' + (selectedCompany || 'the company') + ' has been featured in ' + last24HNews.length + ' news articles. ' +
      'The overall sentiment is ' + overallSentiment.toLowerCase() + ', with ' + positive + ' positive, ' + neutral + ' neutral, and ' + negative + ' negative articles. ' +
      (announcements > 0 ? 'There were ' + announcements + ' major announcements. ' : '') +
      (legal > 0 ? legal + ' legal developments were reported. ' : '') +
      (mna > 0 ? 'The company was involved in ' + mna + ' M&A activities. ' : '') +
      'Coverage was primarily from ' + (topSources[0]?.[0] || 'various sources') + ' and other major outlets.'
    );
    
    const summaryLines = doc.splitTextToSize(execSummary, 180);
    doc.text(summaryLines, 14, 32);
    
    // News Summaries
    let yPosition = 32 + (summaryLines.length * 5) + 15;
    
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text('Detailed News Summaries', 14, yPosition);
    yPosition += 12;
    
    last24HNews.forEach((article, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(11);
      doc.setTextColor(40);
      doc.text((index + 1) + '.', 14, yPosition);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      const sanitizedTitle = sanitizeTextForPDF(article.title);
      const titleLines = doc.splitTextToSize(sanitizedTitle, 170);
      doc.text(titleLines, 24, yPosition);
      yPosition += titleLines.length * 5 + 2;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100);
      const publishedDate = new Date(article.publishedAt);
      const hours = Math.floor((Date.now() - publishedDate) / (1000 * 60 * 60));
      const sanitizedSource = sanitizeTextForPDF(article.source?.name || article.source || 'Unknown');
      doc.text(sanitizedSource + ' | ' + hours + 'h ago | ' + publishedDate.toLocaleString(), 24, yPosition);
      yPosition += 6;
      
      doc.setFontSize(9);
      doc.setTextColor(60);
      const summary = sanitizeTextForPDF(generateSummary(article.title, article.description, article));
      const summaryLines = doc.splitTextToSize(summary, 170);
      doc.text(summaryLines, 24, yPosition);
      yPosition += summaryLines.length * 4 + 6;
      
      // Add clickable source link
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 255);
      doc.textWithLink('Read Full Article', 24, yPosition, { url: article.url });
      doc.setTextColor(0);
      yPosition += 6;
      
      doc.setDrawColor(200);
      doc.line(14, yPosition, 196, yPosition);
      yPosition += 6;
    });
    
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      const footerText = sanitizeTextForPDF(
        'Page ' + i + ' of ' + pageCount + ' | Insight News Report | ' + (selectedCompany || 'Company') + ' | ' + new Date().toLocaleDateString()
      );
      doc.text(
        footerText,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    const fileName = sanitizeTextForPDF((selectedCompany || 'news') + '_summary_' + Date.now()) + '.pdf';
    doc.save(fileName);
    
    console.log(`✅ PDF summary downloaded: ${fileName}`);
    alert(`📄 PDF Summary Report Downloaded!\n\n✅ ${last24HNews.length} articles summarized\n📊 Sentiment analysis included\n📈 Executive summary included`);
    setShowReportMenu(false);
  };

  const handleDownloadExcel = () => {
    const filteredNews = getFilteredNews();
    
    if (filteredNews.length === 0) {
      alert(`No news available from the ${getTimeRangeLabel().toLowerCase()}`);
      setShowReportMenu(false);
      return;
    }

    const last24HNews = filteredNews; // Keep variable name for compatibility

    const excelData = last24HNews.map((article, index) => {
      const publishedDate = new Date(article.publishedAt);
      const hours = Math.floor((Date.now() - publishedDate) / (1000 * 60 * 60));
      const summary = generateSummary(article.title, article.description, article);
      const keyPoints = extractKeyPoints(article);
      
      return {
        '#': index + 1,
        'Title': article.title,
        'Summary': summary,
        'Key Points': keyPoints,
        'Source': article.source?.name || article.source || 'Unknown',
        'Published Date': publishedDate.toLocaleString('en-US'),
        'Hours Ago': hours,
        'Sentiment': article.sentiment || 'neutral',
        'Article Link': article.url
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Add hyperlinks to Article Link column (column I)
    excelData.forEach((item, index) => {
      const cellRef = XLSX.utils.encode_cell({ r: index + 1, c: 8 }); // Column I (9th column, 0-indexed)
      if (worksheet[cellRef]) {
        worksheet[cellRef].l = { Target: item['Article Link'], Tooltip: 'Click to read full article' };
        worksheet[cellRef].v = 'Read Article';
      }
    });
    
    worksheet['!cols'] = [
      { wch: 5 },
      { wch: 50 },
      { wch: 80 },
      { wch: 30 },
      { wch: 20 },
      { wch: 20 },
      { wch: 10 },
      { wch: 12 },
      { wch: 20 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'News Summaries');

    const positive = last24HNews.filter(a => a.sentiment === 'positive').length;
    const negative = last24HNews.filter(a => a.sentiment === 'negative').length;
    const neutral = last24HNews.length - positive - negative;
    
    // Enhanced Executive Summary Sheet
    const overallSentiment = positive > negative ? 'BULLISH' : 
                            positive < negative ? 'BEARISH' : 'NEUTRAL';
    
    const announcements = last24HNews.filter(a => 
      extractKeyPoints(a).includes('New announcement')).length;
    const legal = last24HNews.filter(a => 
      extractKeyPoints(a).includes('Legal matter')).length;
    const mna = last24HNews.filter(a => 
      extractKeyPoints(a).includes('M&A activity')).length;
    const partnerships = last24HNews.filter(a => 
      extractKeyPoints(a).includes('Partnership')).length;
    
    const sources = {};
    last24HNews.forEach(a => {
      const source = a.source?.name || a.source || 'Unknown';
      sources[source] = (sources[source] || 0) + 1;
    });
    const topSources = Object.entries(sources)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const summaryData = [
      { Metric: 'REPORT SUMMARY', Value: '' },
      { Metric: 'Company', Value: selectedCompany || 'N/A' },
      { Metric: 'Report Generated', Value: new Date().toLocaleString() },
      { Metric: 'Time Range', Value: getTimeRangeLabel() },
      { Metric: 'Total Articles', Value: last24HNews.length },
      { Metric: '', Value: '' },
      { Metric: 'SENTIMENT BREAKDOWN', Value: '' },
      { Metric: 'Positive', Value: `${positive} articles (${Math.round(positive/last24HNews.length*100)}%)` },
      { Metric: 'Neutral', Value: `${neutral} articles (${Math.round(neutral/last24HNews.length*100)}%)` },
      { Metric: 'Negative', Value: `${negative} articles (${Math.round(negative/last24HNews.length*100)}%)` },
      { Metric: 'Overall Market Sentiment', Value: overallSentiment },
      { Metric: '', Value: '' },
      { Metric: 'KEY HIGHLIGHTS', Value: '' },
      { Metric: 'New Announcements', Value: announcements },
      { Metric: 'Legal Developments', Value: legal },
      { Metric: 'M&A Activities', Value: mna },
      { Metric: 'Partnerships', Value: partnerships },
      { Metric: '', Value: '' },
      { Metric: 'TOP NEWS SOURCES', Value: '' }
    ];
    
    topSources.forEach(([source, count], idx) => {
      summaryData.push({
        Metric: `${idx + 1}. ${source}`,
        Value: `${count} articles`
      });
    });
    
    summaryData.push({ Metric: '', Value: '' });
    summaryData.push({ Metric: 'EXECUTIVE SUMMARY', Value: '' });
    
    const execSummary = `In the ${getTimeRangeLabel().toLowerCase()}, ${selectedCompany || 'the company'} has been featured in ${last24HNews.length} news articles. ` +
      `The overall sentiment is ${overallSentiment.toLowerCase()}, with ${positive} positive, ${neutral} neutral, and ${negative} negative articles. ` +
      (announcements > 0 ? `There were ${announcements} major announcements. ` : '') +
      (legal > 0 ? `${legal} legal developments were reported. ` : '') +
      (mna > 0 ? `The company was involved in ${mna} M&A activities. ` : '') +
      `Coverage was primarily from ${topSources[0]?.[0] || 'various sources'} and other major outlets.`;
    
    summaryData.push({ Metric: 'Analysis', Value: execSummary });
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');
    
    // Sentiment Analysis Sheet
    const sentimentDetails = last24HNews.map((article, index) => ({
      '#': index + 1,
      'Title': article.title.substring(0, 60) + '...',
      'Sentiment': article.sentiment || 'neutral',
      'Source': article.source?.name || article.source || 'Unknown',
      'Hours Ago': Math.floor((Date.now() - new Date(article.publishedAt)) / (1000 * 60 * 60))
    }));
    
    const sentimentSheet = XLSX.utils.json_to_sheet(sentimentDetails);
    sentimentSheet['!cols'] = [{ wch: 5 }, { wch: 60 }, { wch: 12 }, { wch: 25 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(workbook, sentimentSheet, 'Sentiment Analysis');

    const fileName = `${selectedCompany || 'news'}_summary_${Date.now()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    console.log(`✅ Excel summary downloaded: ${fileName}`);
    alert(`📊 Excel Summary Report Downloaded!\n\n✅ ${last24HNews.length} articles summarized\n📈 Executive summary included\n📊 3 detailed sheets generated`);
    setShowReportMenu(false);
  };

  return (
    <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
      {/* Home Button */}
      <button
        onClick={() => onGoHome && onGoHome()}
        className="w-8 h-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
        aria-label="Home"
        title="Back to Home"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </button>

      {/* X (Twitter) Button */}
      <button
        onClick={() => {
          if (selectedCompany) {
            onOpenTwitterFeed && onOpenTwitterFeed();
          } else {
            alert('Please select a company first to view Twitter updates');
          }
        }}
        className={`w-8 h-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 flex items-center justify-center ${
          currentView === 'twitter'
            ? 'bg-blue-500 dark:bg-blue-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
        aria-label="X"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </button>

      {/* Dashboard Button */}
      <button
        onClick={() => onOpenDashboard && onOpenDashboard()}
        className={`w-8 h-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 flex items-center justify-center ${
          currentView === 'dashboard'
            ? 'bg-blue-500 dark:bg-blue-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
        aria-label="Dashboard"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </button>

      {/* Report Button - Only show when company is selected */}
      {selectedCompany && (
        <div className="relative">
          <button
            onClick={() => setShowReportMenu(!showReportMenu)}
            className={`w-8 h-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 flex items-center justify-center ${
              newsData && newsData.length > 0
                ? 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                : 'bg-gray-300 dark:bg-gray-800 cursor-not-allowed opacity-50'
            }`}
            aria-label="Download report"
            disabled={!newsData || newsData.length === 0}
          >
            <svg
              className={`w-4 h-4 ${
                newsData && newsData.length > 0
                  ? 'text-gray-700 dark:text-gray-300'
                  : 'text-gray-500 dark:text-gray-600'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </button>

        {/* Report Dropdown Menu */}
        {showReportMenu && (
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 max-h-96 overflow-y-auto">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Generate Summary Report
              </p>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Time Period
              </label>
              <select
                value={reportFilterDays}
                onChange={(e) => handleReportFilterChange(e.target.value)}
                className="w-full p-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
              >
                <option value={0}>All Time</option>
                <option value={30}>Last 1 Month</option>
                <option value={90}>Last 3 Months</option>
                <option value={180}>Last 6 Months</option>
                <option value={365}>Last 1 Year</option>
                <option value="custom">Custom Date Range</option>
              </select>

              {/* Custom Date Picker */}
              {showCustomReportDate && (
                <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1.5">Select Date Range</p>
                  <div className="space-y-1.5">
                    <div>
                      <label className="text-[10px] text-gray-600 dark:text-gray-400 mb-0.5 block">From:</label>
                      <input
                        type="date"
                        value={customReportStartDate}
                        onChange={(e) => setCustomReportStartDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full p-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-600 dark:text-gray-400 mb-0.5 block">To:</label>
                      <input
                        type="date"
                        value={customReportEndDate}
                        onChange={(e) => setCustomReportEndDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        min={customReportStartDate}
                        className="w-full p-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-1.5 mt-1.5">
                      <button
                        onClick={handleCustomReportDateApply}
                        disabled={!customReportStartDate || !customReportEndDate}
                        className="flex-1 px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => {
                          setShowCustomReportDate(false);
                          setCustomReportStartDate('');
                          setCustomReportEndDate('');
                        }}
                        className="flex-1 px-2 py-1 text-xs font-semibold bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getFilteredNews().length} articles • Smart summaries included
              </p>
            </div>
            
            <button
              onClick={handleDownloadPDF}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <div>
                <div> Download PDF </div>
                <div className="text-xs text-gray-500">Formatted report with key points</div>
              </div>
            </button>
            
            <button
              onClick={handleDownloadExcel}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <div>
                <div> Download Excel </div>
                <div className="text-xs text-gray-500">Spreadsheet with analysis</div>
              </div>
            </button>
          </div>
        )}
        </div>
      )}

      {/* Gmail-style Sidebar Button */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 shadow-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 transform hover:scale-110 flex items-center justify-center"
        aria-label="Menu"
      >
        <svg
          className="w-4 h-4 text-gray-700 dark:text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Gmail-style Slide-out Sidebar */}
      {showSidebar && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowSidebar(false)}
          />
          
          {/* Sidebar Panel */}
          <div className="fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Menu</h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {/* News Feed */}
              <button 
                onClick={() => {
                  setShowSidebar(false);
                  onOpenNewsFeed && onOpenNewsFeed();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <span className="font-medium text-sm text-gray-800 dark:text-white">News Feed</span>
              </button>

              {/* Bookmarks */}
              <button 
                onClick={() => {
                  setShowSidebar(false);
                  onOpenBookmarks && onOpenBookmarks();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span className="font-medium text-sm text-gray-800 dark:text-white">Bookmarks</span>
              </button>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Insight News © 2025
              </div>
            </div>
          </div>
        </>
      )}

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} onSettingsSaved={onSettingsChange} />
    </div>
  );
}

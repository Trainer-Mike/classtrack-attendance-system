import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { ShieldCheck, Calendar, Layers, FileOutput, Check, Users, FileText, Download, School } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const DpDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('trainer'); // 'trainer' | 'class'
  const [stats, setStats] = useState([]);
  const [classStats, setClassStats] = useState([]);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('week');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [term, setTerm] = useState('1');
  const [isApproved, setIsApproved] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchStats();
    setIsApproved(false);
  }, [filter, selectedWeek]);

  const fetchStats = async () => {
    try {
      const [trainerRes, classRes] = await Promise.all([
        axios.get(`${API_URL}/attendance/stats?filter=${filter}&week=${selectedWeek}`, { headers }),
        axios.get(`${API_URL}/attendance/class-stats?filter=${filter}&week=${selectedWeek}`, { headers }),
      ]);
      setStats(trainerRes.data);
      setClassStats(classRes.data);
    } catch (err) { console.error(err); }
  };

  const handleApproveAll = async () => {
    try {
      await axios.patch(`${API_URL}/reports/approve-all`, {}, { headers });
      setMessage('Department report officially approved.');
      setIsApproved(true);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`Failed: ${err.response?.data?.error || err.message}`);
    }
  };

  // ── Trainer PDF (with signatories) ─────────────────────────────────
  const handleDownloadOverviewPDF = () => {
    if (!stats.length) { setMessage('No data to download.'); setTimeout(() => setMessage(''), 3000); return; }
    const doc = new jsPDF('landscape');
    const totalExpected = stats.reduce((s, r) => s + r.total_lessons, 0);
    const totalAttended = stats.reduce((s, r) => s + r.attended_lessons, 0);
    const totalMissed   = stats.reduce((s, r) => s + r.missed_lessons, 0);
    const totalMakeup   = stats.reduce((s, r) => s + r.makeup_lessons, 0);
    const overallPct    = totalExpected > 0 ? ((totalAttended / totalExpected) * 100).toFixed(1) : 0;
    doc.setFontSize(16); doc.setTextColor(11, 31, 59);
    doc.text('Official Academic Department Attendance Report', 14, 20);
    doc.setFontSize(11); doc.setTextColor(80, 80, 80);
    const periodStr = filter === 'week' ? `Week ${selectedWeek || (stats[0]?.max_week || 1)}` : 'Termly';
    doc.text(`Year: ${new Date().getFullYear()}  |  Term: ${term}  |  Period: ${periodStr}`, 14, 28);
    doc.text(`Overall: ${overallPct}%  |  Expected: ${totalExpected}  |  Attended: ${totalAttended}  |  Missed: ${totalMissed}  |  Makeup: ${totalMakeup}`, 14, 34);
    autoTable(doc, {
      head: [["Trainer","Subject",`Expected (${filter})`,"Attended","Missed","Makeup","Attend %","Remarks"]],
      body: stats.map(s=>[s.trainer_name,s.subject_name,s.total_lessons,s.attended_lessons,s.missed_lessons,s.makeup_lessons,`${s.percentage}%`,s.remarks]),
      startY: 42, theme: 'grid',
      headStyles: { fillColor: [0,128,0], textColor: [255,255,255] },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248,250,252] },
    });
    const finalY = doc.lastAutoTable.finalY + 25;
    doc.setFontSize(11); doc.setTextColor(0,0,0);
    doc.text("_________________________", 20, finalY);
    doc.text("Checked by: HOD", 20, finalY + 6);
    doc.text("Date: ___________________", 20, finalY + 12);
    doc.text("_________________________", doc.internal.pageSize.width - 70, finalY);
    doc.text("Approved by: DP Academics", doc.internal.pageSize.width - 70, finalY + 6);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.width - 70, finalY + 12);
    doc.save(`DP_Approved_Trainer_Report_T${term}_${periodStr}.pdf`);
  };

  // ── Trainer CSV ────────────────────────────────────────────────────
  const handleDownloadTrainerCSV = () => {
    if (!stats.length) { setMessage('No data.'); setTimeout(()=>setMessage(''),3000); return; }
    const header = ['Trainer','Subject',`Expected (${filter})`,'Attended','Missed','Makeup','Attend %','Remarks'];
    const rows = stats.map(s=>[`"${s.trainer_name}"`,`"${s.subject_name}"`,s.total_lessons,s.attended_lessons,s.missed_lessons,s.makeup_lessons,`"${s.percentage}%"`,`"${s.remarks}"`]);
    const csv = "data:text/csv;charset=utf-8," + [header.join(','), ...rows.map(r=>r.join(','))].join('\n');
    const a = document.createElement('a'); a.href=encodeURI(csv); a.download=`trainer_attendance_${filter}.csv`; document.body.appendChild(a); a.click(); a.remove();
  };

  // ── Class CSV ──────────────────────────────────────────────────────
  const handleDownloadClassCSV = () => {
    if (!classStats.length) { setMessage('No class data.'); setTimeout(()=>setMessage(''),3000); return; }
    const header = ['Class','Term','Subject','Trainer',`Expected (${filter})`,'Attended','Missed','Makeup','Attend %','Remarks'];
    const rows = classStats.map(r=>[`"${r.class_name}"`,`"${r.term}"`,`"${r.subject_name}"`,`"${r.trainer_name}"`,r.total_lessons,r.attended_lessons,r.missed_lessons,r.makeup_lessons,`"${r.percentage}%"`,`"${r.remarks}"`]);
    const csv = "data:text/csv;charset=utf-8," + [header.join(','), ...rows.map(r=>r.join(','))].join('\n');
    const a = document.createElement('a'); a.href=encodeURI(csv); a.download=`class_attendance_${filter}.csv`; document.body.appendChild(a); a.click(); a.remove();
  };

  // ── Class PDF (with signatories) ───────────────────────────────────
  const handleDownloadClassPDF = () => {
    if (!classStats.length) { setMessage('No class data.'); setTimeout(()=>setMessage(''),3000); return; }
    const doc = new jsPDF('landscape');
    doc.setFontSize(16); doc.setTextColor(11,31,59);
    doc.text(`Official Class Attendance Report — ${filter.toUpperCase()}`, 14, 20);
    doc.setFontSize(10); doc.setTextColor(80,80,80);
    doc.text(`Year: ${new Date().getFullYear()}  |  Term: ${term}  |  Generated: ${new Date().toLocaleDateString()}`, 14, 28);
    autoTable(doc, {
      head: [["Class","Term","Subject","Trainer",`Expected (${filter})`,"Attended","Missed","Makeup","Attend %","Remarks"]],
      body: classStats.map(r=>[r.class_name,r.term,r.subject_name,r.trainer_name,r.total_lessons,r.attended_lessons,r.missed_lessons,r.makeup_lessons,`${r.percentage}%`,r.remarks]),
      startY: 35, theme: 'grid',
      headStyles: { fillColor: [79,70,229], textColor: [255,255,255] },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248,250,252] },
    });
    const finalY = doc.lastAutoTable.finalY + 25;
    doc.setFontSize(11); doc.setTextColor(0,0,0);
    doc.text("_________________________", 20, finalY);
    doc.text("Checked by: HOD", 20, finalY + 6);
    doc.text("Date: ___________________", 20, finalY + 12);
    doc.text("_________________________", doc.internal.pageSize.width - 70, finalY);
    doc.text("Approved by: DP Academics", doc.internal.pageSize.width - 70, finalY + 6);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.width - 70, finalY + 12);
    doc.save(`DP_Class_Attendance_T${term}_${filter}.pdf`);
  };

  // ── Aggregates & Chart Data ────────────────────────────────────────
  const totalExpected = stats.reduce((s,r)=>s+r.total_lessons,0);
  const totalAttended = stats.reduce((s,r)=>s+r.attended_lessons,0);
  const totalMissed   = stats.reduce((s,r)=>s+r.missed_lessons,0);
  const totalMakeup   = stats.reduce((s,r)=>s+r.makeup_lessons,0);
  const overallPct    = totalExpected > 0 ? ((totalAttended/totalExpected)*100).toFixed(1) : 0;
  const overallColor  = overallPct >= 90 ? '#10b981' : overallPct >= 70 ? '#f59e0b' : '#ef4444';
  const overallLabel  = overallPct >= 90 ? 'Excellent' : overallPct >= 70 ? 'Satisfactory' : 'Needs Improvement';
  const uniqueTrainers = new Set(stats.map(s=>s.trainer_name)).size;

  const trainerChartData = stats.map(s=>({
    name: `${s.trainer_name.split(' ')[0]}/${s.subject_name.split(' ')[0]}`,
    Attended: s.attended_lessons, Missed: s.missed_lessons, Makeup: s.makeup_lessons,
  }));

  const classGroups = {};
  classStats.forEach(r => {
    if (!classGroups[r.class_name]) classGroups[r.class_name]={ class_name:r.class_name, Attended:0, Missed:0, Makeup:0 };
    classGroups[r.class_name].Attended += r.attended_lessons;
    classGroups[r.class_name].Missed   += r.missed_lessons;
    classGroups[r.class_name].Makeup   += r.makeup_lessons;
  });
  const classChartData = Object.values(classGroups);

  const filterBar = (
    <div style={{display:'flex',gap:'1rem',marginBottom:'1.5rem',alignItems:'center',flexWrap:'wrap'}}>
      <button className={`btn ${filter==='week'?'btn-primary':'btn-outline'}`} onClick={()=>{setFilter('week');setSelectedWeek('');setIsApproved(false);}} style={{width:'auto',display:'flex',alignItems:'center',gap:'0.5rem'}}>
        <Calendar size={16}/> Weekly
      </button>
      {filter==='week' && (
        <select className="form-control" style={{width:'auto',padding:'0.4rem 2rem 0.4rem 0.5rem',margin:0}} value={selectedWeek} onChange={e=>setSelectedWeek(e.target.value)}>
          <option value="">Auto (Last 7 Days)</option>
          {[...Array(12)].map((_,i)=><option key={i+1} value={i+1}>Week {i+1}</option>)}
        </select>
      )}
      <button className={`btn ${filter==='term'?'btn-primary':'btn-outline'}`} onClick={()=>{setFilter('term');setIsApproved(false);}} style={{width:'auto',display:'flex',alignItems:'center',gap:'0.5rem'}}>
        <Layers size={16}/> Termly
      </button>
      <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'0.5rem',flexWrap:'wrap'}}>
        <select className="form-control" style={{width:'auto',padding:'0.4rem 2rem 0.4rem 0.5rem',margin:0}} value={term} onChange={e=>setTerm(e.target.value)}>
          <option value="1">Term 1</option>
          <option value="2">Term 2</option>
          <option value="3">Term 3</option>
        </select>
        {!isApproved ? (
          <button className="btn btn-primary" style={{display:'flex',alignItems:'center',gap:'0.5rem',width:'auto'}} onClick={handleApproveAll}>
            <Check size={16}/> Approve All Reports
          </button>
        ) : (
          <span style={{color:'#10b981',fontWeight:600,fontSize:'0.875rem'}}>✅ Approved</span>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {message && <div style={{padding:'1rem',backgroundColor:'#d1fae5',color:'#065f46',borderRadius:'8px',marginBottom:'1rem'}}>{message}</div>}

      {/* Tabs */}
      <div style={{display:'flex',gap:'1rem',marginBottom:'1.5rem'}}>
        <button className={`btn ${activeTab==='trainer'?'btn-primary':'btn-outline'}`} onClick={()=>setActiveTab('trainer')} style={{width:'auto',display:'flex',alignItems:'center',gap:'0.5rem'}}>
          <Users size={16}/> Trainer Reports
        </button>
        <button className={`btn ${activeTab==='class'?'btn-primary':'btn-outline'}`} onClick={()=>setActiveTab('class')} style={{width:'auto',display:'flex',alignItems:'center',gap:'0.5rem'}}>
          <School size={16}/> Class Reports
        </button>
      </div>

      {filterBar}

      {/* KPI Cards */}
      <div className="grid-cards">
        <div className="card"><div className="card-icon"><Users size={20}/></div><div className="card-title">Trainers</div><div className="card-value">{uniqueTrainers}</div></div>
        <div className="card"><div className="card-icon"><FileText size={20}/></div><div className="card-title">Expected ({filter})</div><div className="card-value">{totalExpected}</div></div>
        <div className="card"><div className="card-icon" style={{backgroundColor:'#d1fae5',color:'#10b981'}}>✔</div><div className="card-title">Attended</div><div className="card-value" style={{color:'#10b981'}}>{totalAttended}</div></div>
        <div className="card"><div className="card-icon" style={{backgroundColor:'#fee2e2',color:'#ef4444'}}>✘</div><div className="card-title">Missed</div><div className="card-value" style={{color:'#ef4444'}}>{totalMissed}</div></div>
      </div>

      {/* Overall Panel */}
      {stats.length > 0 && (
        <div className="card" style={{marginBottom:'1.5rem',borderLeft:`4px solid ${overallColor}`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1rem'}}>
            <div>
              <div style={{fontSize:'0.8rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-secondary)',marginBottom:'0.35rem'}}>
                Overall Department — {filter==='week'?'This Week':'This Term'}
              </div>
              <div style={{display:'flex',alignItems:'baseline',gap:'0.75rem'}}>
                <span style={{fontSize:'2.5rem',fontWeight:800,color:overallColor,lineHeight:1}}>{overallPct}%</span>
                <span style={{padding:'0.2rem 0.75rem',borderRadius:'9999px',fontSize:'0.78rem',fontWeight:700,backgroundColor:overallPct>=90?'#d1fae5':overallPct>=70?'#fef3c7':'#fee2e2',color:overallPct>=90?'#065f46':overallPct>=70?'#92400e':'#991b1b'}}>{overallLabel}</span>
              </div>
              <div style={{marginTop:'0.85rem',width:'320px',maxWidth:'100%',backgroundColor:'#e2e8f0',height:'10px',borderRadius:'5px',overflow:'hidden'}}>
                <div style={{height:'100%',width:`${overallPct}%`,backgroundColor:overallColor,transition:'width 0.6s ease'}}/>
              </div>
            </div>
            <div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
              {[{label:'Expected',value:totalExpected,bg:'#f1f5f9',text:'#334155'},{label:'Attended',value:totalAttended,bg:'#d1fae5',text:'#065f46'},{label:'Missed',value:totalMissed,bg:'#fee2e2',text:'#991b1b'},{label:'Makeup',value:totalMakeup,bg:'#fef3c7',text:'#92400e'}].map(item=>(
                <div key={item.label} style={{textAlign:'center',backgroundColor:item.bg,color:item.text,borderRadius:'10px',padding:'0.6rem 1.1rem',minWidth:'72px'}}>
                  <div style={{fontSize:'1.4rem',fontWeight:700}}>{item.value}</div>
                  <div style={{fontSize:'0.72rem',fontWeight:600,textTransform:'uppercase'}}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TRAINER TAB ═══ */}
      {activeTab === 'trainer' && (
        <div className="card">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'0.5rem',marginBottom:'1.5rem',paddingBottom:'1rem',borderBottom:'1px solid var(--border-color)'}}>
            <h2 className="card-title" style={{margin:0}}>Trainer Breakdown — {filter==='week'?'This Week':'This Term'}</h2>
            <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap'}}>
              <button className="btn btn-outline" style={{display:'flex',alignItems:'center',gap:'0.5rem',width:'auto',border:'1px solid var(--primary-color)',color:'var(--primary-color)'}} onClick={handleDownloadTrainerCSV}><Download size={16}/> CSV</button>
              <button className="btn btn-primary" style={{display:'flex',alignItems:'center',gap:'0.5rem',width:'auto'}} onClick={handleDownloadOverviewPDF}><FileOutput size={16}/> PDF + Sign</button>
            </div>
          </div>

          {trainerChartData.length > 0 && (
            <div style={{marginBottom:'2rem'}}>
              <h3 style={{fontSize:'0.9rem',fontWeight:600,marginBottom:'1rem',color:'var(--text-secondary)'}}>Trainer Attendance Chart</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={trainerChartData} margin={{top:5,right:20,left:0,bottom:60}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                  <XAxis dataKey="name" tick={{fontSize:10}} angle={-30} textAnchor="end" interval={0}/>
                  <YAxis tick={{fontSize:11}}/>
                  <Tooltip/><Legend wrapperStyle={{paddingTop:'1rem'}}/>
                  <Bar dataKey="Attended" fill="#10b981" radius={[4,4,0,0]}/>
                  <Bar dataKey="Missed" fill="#ef4444" radius={[4,4,0,0]}/>
                  <Bar dataKey="Makeup" fill="#f59e0b" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="table-container" style={{margin:0,border:'none',boxShadow:'none'}}>
            <table>
              <thead>
                <tr>
                  <th>Trainer</th><th>Subject</th><th>Expected<br/><span style={{fontSize:'0.75rem'}}>({filter})</span></th>
                  <th>Attended</th><th>Missed</th><th>Makeup</th><th>Attendance %</th><th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((row,i)=>(
                  <tr key={i}>
                    <td style={{fontWeight:600}}>{row.trainer_name}</td>
                    <td>{row.subject_name}</td>
                    <td style={{fontWeight:600}}>{row.total_lessons}</td>
                    <td style={{color:'var(--accent-success)',fontWeight:600}}>{row.attended_lessons}</td>
                    <td style={{color:'var(--accent-error)',fontWeight:600}}>{row.missed_lessons}</td>
                    <td style={{color:'var(--accent-warning)',fontWeight:600}}>{row.makeup_lessons}</td>
                    <td>
                      <div style={{display:'flex',flexDirection:'column',gap:'3px'}}>
                        <span style={{fontWeight:700,color:row.percentage>=90?'#10b981':row.percentage>=70?'#f59e0b':'#ef4444'}}>{row.percentage}%</span>
                        <div style={{width:'60px',backgroundColor:'#e2e8f0',height:'5px',borderRadius:'3px',overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${row.percentage}%`,backgroundColor:row.percentage>=90?'#10b981':row.percentage>=70?'#f59e0b':'#ef4444'}}/>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${row.percentage>=90?'badge-success':row.percentage>=70?'badge-warning':'badge-danger'}`}>{row.remarks}</span></td>
                  </tr>
                ))}
                {stats.length===0 && <tr><td colSpan="8" style={{textAlign:'center',padding:'2rem'}}>No data for this {filter}.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ CLASS TAB ═══ */}
      {activeTab === 'class' && (
        <div className="card">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'0.5rem',marginBottom:'1.5rem',paddingBottom:'1rem',borderBottom:'1px solid var(--border-color)'}}>
            <h2 className="card-title" style={{margin:0}}>Class Attendance — {filter==='week'?'This Week':'This Term'}</h2>
            <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap'}}>
              <button className="btn btn-outline" style={{display:'flex',alignItems:'center',gap:'0.5rem',width:'auto',border:'1px solid #4f46e5',color:'#4f46e5'}} onClick={handleDownloadClassCSV}><Download size={16}/> CSV</button>
              <button className="btn btn-primary" style={{display:'flex',alignItems:'center',gap:'0.5rem',width:'auto',backgroundColor:'#4f46e5'}} onClick={handleDownloadClassPDF}><FileOutput size={16}/> PDF + Sign</button>
            </div>
          </div>

          {classChartData.length > 0 && (
            <div style={{marginBottom:'2rem'}}>
              <h3 style={{fontSize:'0.9rem',fontWeight:600,marginBottom:'1rem',color:'var(--text-secondary)'}}>Attendance per Class</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={classChartData} margin={{top:5,right:20,left:0,bottom:20}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                  <XAxis dataKey="class_name" tick={{fontSize:12}}/>
                  <YAxis tick={{fontSize:11}}/>
                  <Tooltip/><Legend/>
                  <Bar dataKey="Attended" fill="#10b981" radius={[4,4,0,0]}/>
                  <Bar dataKey="Missed" fill="#ef4444" radius={[4,4,0,0]}/>
                  <Bar dataKey="Makeup" fill="#f59e0b" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="table-container" style={{margin:0,border:'none',boxShadow:'none'}}>
            <table>
              <thead>
                <tr>
                  <th>Class</th><th>Term</th><th>Subject</th><th>Trainer</th>
                  <th>Expected</th><th>Attended</th><th>Missed</th><th>Makeup</th><th>Attendance %</th><th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {classStats.map((row,i)=>(
                  <tr key={i}>
                    <td style={{fontWeight:700}}>
                      <span style={{background:'#e0e7ff',color:'#4f46e5',padding:'0.15rem 0.5rem',borderRadius:'4px',fontSize:'0.82rem'}}>{row.class_name}</span>
                    </td>
                    <td style={{fontSize:'0.85rem',color:'var(--text-secondary)'}}>{row.term}</td>
                    <td style={{fontWeight:600}}>{row.subject_name}</td>
                    <td>{row.trainer_name}</td>
                    <td style={{fontWeight:600}}>{row.total_lessons}</td>
                    <td style={{color:'#10b981',fontWeight:600}}>{row.attended_lessons}</td>
                    <td style={{color:'#ef4444',fontWeight:600}}>{row.missed_lessons}</td>
                    <td style={{color:'#f59e0b',fontWeight:600}}>{row.makeup_lessons}</td>
                    <td>
                      <div style={{display:'flex',flexDirection:'column',gap:'3px'}}>
                        <span style={{fontWeight:700,color:row.percentage>=90?'#10b981':row.percentage>=70?'#f59e0b':'#ef4444'}}>{row.percentage}%</span>
                        <div style={{width:'60px',backgroundColor:'#e2e8f0',height:'5px',borderRadius:'3px',overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${row.percentage}%`,backgroundColor:row.percentage>=90?'#10b981':row.percentage>=70?'#f59e0b':'#ef4444'}}/>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${row.percentage>=90?'badge-success':row.percentage>=70?'badge-warning':'badge-danger'}`}>{row.remarks}</span></td>
                  </tr>
                ))}
                {classStats.length===0 && <tr><td colSpan="10" style={{textAlign:'center',padding:'2rem'}}>No class data for this {filter}.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DpDashboard;

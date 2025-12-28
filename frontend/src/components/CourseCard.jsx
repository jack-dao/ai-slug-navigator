import React, { useState } from 'react';
import { Clock, User, Plus, Star, Users, CheckCircle2 } from 'lucide-react';

const CourseCard = ({ course, onAdd, professorRatings, onShowProfessor }) => {
  const [selectedLabs, setSelectedLabs] = useState({});

  const formatInstructor = (name) => {
    if (!name) return "Staff";
    return name.replace(/,/g, ', ');
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5 mr-1.5">
        {[...Array(5)].map((_, i) => {
          const starValue = i + 1;
          let fillPercent = 0;
          
          if (rating >= starValue) {
            fillPercent = 100;
          } else if (rating > i && rating < starValue) {
            fillPercent = (rating - i) * 100;
          }

          return (
            <div key={i} className="relative">
              {/* Background Star (Gray) */}
              <Star className="w-3 h-3 text-slate-200" />
              {/* Foreground Star (Filled) */}
              <div 
                className="absolute top-0 left-0 overflow-hidden h-full transition-all duration-500" 
                style={{ width: `${fillPercent}%` }}
              >
                <Star className="w-3 h-3 fill-current text-amber-400" />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.0) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (rating >= 3.0) return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-rose-50 text-rose-700 border-rose-100';
  };

  const getCapacityStyles = (enrolled, capacity) => {
    if (!capacity || capacity === 0) return 'bg-slate-100 text-slate-600 border-slate-200';
    const ratio = enrolled / capacity;
    if (ratio >= 1) return 'bg-rose-50 text-rose-700 border-rose-100';
    if (ratio >= 0.85) return 'bg-orange-50 text-orange-700 border-orange-100';
    return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  };

  const handleLabSelection = (lectureId, labId) => {
    setSelectedLabs(prev => ({ ...prev, [lectureId]: labId }));
  };

  const handleAddClick = (section) => {
    const hasLabs = section.subSections && section.subSections.length > 0;
    const selectedLabId = selectedLabs[section.id];
    let finalSectionData = section;

    if (hasLabs) {
       if (!selectedLabId) {
         alert("Please select a Lab/Discussion section first.");
         return;
       }
       const lab = section.subSections.find(l => l.id === parseInt(selectedLabId));
       finalSectionData = { ...section, selectedLab: lab };
    }
    onAdd(course, finalSectionData);
  };

  return (
    <div className="group bg-white rounded-xl border-y border-r border-slate-200 border-l-4 border-l-indigo-500 shadow-sm hover:shadow-indigo-100/50 hover:shadow-lg transition-all duration-300 overflow-hidden mb-4">
      
      {/* CARD HEADER: Subtly colorized background */}
      <div className="px-6 py-4 border-b border-slate-50 bg-indigo-50/20 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">{course.code}</h3>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded shadow-sm">
                <CheckCircle2 className="w-3 h-3" />
                {course.credits} Units
              </div>
            </div>
            <p className="text-slate-500 font-medium text-sm mt-0.5">{course.name}</p>
          </div>
      </div>

      {/* SECTIONS LIST */}
      <div className="p-2">
        {course.sections?.map((section) => {
             const hasLabs = section.subSections && section.subSections.length > 0;
             const isLabSelected = selectedLabs[section.id];
             const ratingData = professorRatings && professorRatings[section.instructor];
             const fillPercentage = Math.min((section.enrolled / section.capacity) * 100, 100);

             return (
              <div key={section.id} className="p-4 rounded-xl hover:bg-slate-50/80 transition-all group/section">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 space-y-3.5">
                    
                    {/* STATUS & CAPACITY ROW with Progress Bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex overflow-hidden rounded-md border border-slate-200 shadow-sm">
                        <span className={`text-[10px] px-2.5 py-1 font-black uppercase tracking-widest ${
                          section.status === 'Open' ? 'bg-emerald-500 text-white' : 
                          section.status === 'Wait List' ? 'bg-orange-500 text-white' : 'bg-rose-500 text-white'
                        }`}>
                          {section.status}
                        </span>
                        <div className={`px-2.5 py-1 text-[10px] font-bold flex items-center gap-1.5 bg-white ${getCapacityStyles(section.enrolled, section.capacity).split(' ')[1]}`}>
                          <Users className="w-3 h-3 text-indigo-400" />
                          {section.enrolled} / {section.capacity}
                        </div>
                      </div>
                      
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            fillPercentage >= 100 ? 'bg-rose-500' : fillPercentage >= 80 ? 'bg-orange-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${fillPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* INSTRUCTOR & RATING ROW with Partial Stars */}
                    <div className="flex items-center flex-wrap gap-4">
                        <button 
                          onClick={() => onShowProfessor(section.instructor, ratingData)}
                          className={`flex items-center gap-2 transition-all font-bold text-sm ${
                            ratingData ? 'text-indigo-600 hover:text-indigo-800' : 'text-slate-400'
                          }`}
                        >
                            <User className="w-4 h-4 text-indigo-400" />
                            <span className="underline decoration-indigo-100 underline-offset-4 hover:decoration-indigo-600 transition-all">
                              {formatInstructor(section.instructor)}
                            </span>
                        </button>

                        {ratingData && (
                          <div className={`flex items-center px-2.5 py-1 rounded-full border text-[10px] font-black shadow-sm ${getRatingColor(ratingData.avgRating)}`}>
                            {renderStars(ratingData.avgRating)}
                            <span>{ratingData.avgRating} / 5</span>
                          </div>
                        )}
                    </div>

                    {/* TIME & LOCATION */}
                    <div className="flex items-center gap-5 text-xs text-slate-500 font-bold">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-indigo-400" />
                          <span>{section.days} {section.startTime} — {section.endTime}</span>
                        </div>
                    </div>
                    
                    {/* LAB SELECTOR: Modernized dropdown */}
                    {hasLabs && (
                        <div className="mt-3">
                            <select 
                                className="w-full text-[11px] font-bold border border-slate-200 rounded-xl p-2.5 bg-white hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer shadow-sm"
                                value={selectedLabs[section.id] || ""}
                                onChange={(e) => handleLabSelection(section.id, e.target.value)}
                            >
                                <option value="">-- Select Lab Section --</option>
                                {section.subSections.map(lab => (
                                    <option key={lab.id} value={lab.id}>
                                        {lab.sectionNumber} • {lab.days} {lab.startTime} ({lab.enrolled}/{lab.capacity})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                  </div>

                  {/* ACTION BUTTON: Interactive styling */}
                  <button
                    onClick={() => handleAddClick(section)}
                    className={`mt-1 flex items-center justify-center w-12 h-12 rounded-2xl transition-all shadow-md active:scale-95 ${
                       hasLabs && !isLabSelected 
                       ? 'bg-slate-50 text-slate-200 cursor-not-allowed border border-slate-100' 
                       : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200'
                    }`}
                    disabled={hasLabs && !isLabSelected}
                  >
                    <Plus className="w-7 h-7" />
                  </button>
                </div>
                <div className="h-px bg-slate-50 mt-4 group-last:hidden" />
              </div>
             );
          })
        }
      </div>
    </div>
  );
};

export default CourseCard;
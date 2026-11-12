// Original imtahanın nəticələrini dəyişmədən səhv sualları təkrar işləmək.
(function(){
const baseRender=render,baseSave=save,baseGoto=goto;
state.mistakes ||= {};state.reviewAnswers ||= {};state.reviewChecked ||= {};state.reviewMode ||= false;
const wrongIds=()=>QUESTIONS.filter(q=>state.mistakes[q.number]).map(q=>q.number);
function noteMistakes(){
if(state.reviewMode)return;
for(const q of QUESTIONS){const a=state.answers[q.number];if(!state.checked[q.number]||!a||!q.answer||a===q.answer)continue;
const m=state.mistakes[q.number]||{count:0};
if(m.lastChoice!==a||!m.lastMarked){m.count++;m.lastChoice=a;m.lastMarked=Date.now();}
state.mistakes[q.number]=m;}
}
save=function(){noteMistakes();baseSave();};
goto=function(i){if(state.reviewMode){const ids=wrongIds();if(!ids.length)state.reviewMode=false;else{
const q=QUESTIONS[Math.max(0,Math.min(QUESTIONS.length-1,i))];if(!ids.includes(q.number)){
const current=ids.indexOf(QUESTIONS[state.index].number),step=i>state.index?1:-1;
i=QUESTIONS.findIndex(v=>v.number===ids[Math.max(0,Math.min(ids.length-1,current+step))]);}}}
baseGoto(i);};
render=function(){
const reviewing=!!state.reviewMode;let a,c;
if(reviewing){a=state.answers;c=state.checked;state.answers=state.reviewAnswers;state.checked=state.reviewChecked;}
baseRender();
if(reviewing){
state.answers=a;state.checked=c;
document.getElementById('counter').textContent+=' • Təkrar';
const q=QUESTIONS[state.index],opts=document.getElementById('options');
const labels=[...opts.querySelectorAll('label')],ordered=perm(q);
labels.forEach((label,i)=>{
const original=label.querySelector('input');if(!original)return;
const clone=original.cloneNode(true);original.replaceWith(clone);
clone.addEventListener('change',()=>{state.reviewAnswers[q.number]=ordered[i].id;
if(state.autoCheck)state.reviewChecked[q.number]=true;else delete state.reviewChecked[q.number];
save();render();});
});
const selected=state.reviewAnswers[q.number];
if(state.reviewChecked[q.number]){
const fb=document.getElementById('feedback'),good=selected===q.answer;
fb.className='feedback '+(good?'ok':'no');
fb.textContent=!q.answer?'Mənbədə düzgün cavab yoxdur':good?'Düzgün cavab!':'Yanlış. Düzgün cavab: '+q.answer;
}
document.getElementById('previous').disabled=wrongIds()[0]===q.number;
document.getElementById('next').disabled=wrongIds().at(-1)===q.number;
[...document.getElementById('numberGrid').children].forEach((b,i)=>{
const question=QUESTIONS[i],answer=state.reviewAnswers[question.number];
b.classList.remove('answered','checked-ok','checked-bad');
if(answer)b.classList.add('answered');
if(state.reviewChecked[question.number]&&question.answer)b.classList.add(answer===question.answer?'checked-ok':'checked-bad');
});
}
document.getElementById('reviewBanner').classList.toggle('hide',!reviewing);
document.getElementById('mistakeCount').textContent=wrongIds().length;
};
const check=document.getElementById('check'),checkClone=check.cloneNode(true);check.replaceWith(checkClone);
checkClone.addEventListener('click',()=>{const q=QUESTIONS[state.index];if(state.reviewMode)state.reviewChecked[q.number]=true;
else state.checked[q.number]=true;save();render();});
document.getElementById('retryMistakes').addEventListener('click',()=>{
const ids=wrongIds();if(!ids.length)return alert('Hələ səhv sual yoxdur.');
state.reviewMode=true;state.reviewAnswers={};state.reviewChecked={};baseGoto(QUESTIONS.findIndex(q=>q.number===ids[0]));});
document.getElementById('exitReview').addEventListener('click',()=>{state.reviewMode=false;save();render();});
document.getElementById('clearMistakes').addEventListener('click',()=>{
if(!confirm('Səhv cavabların tarixçəsi silinsin?'))return;
state.mistakes={};state.reviewAnswers={};state.reviewChecked={};state.reviewMode=false;save();render();});
const reset=document.getElementById('reset'),resetClone=reset.cloneNode(true);reset.replaceWith(resetClone);
resetClone.addEventListener('click',()=>{
if(!confirm('Cari imtahan sıfırlansın? Səhvlərin tarixçəsi saxlanacaq.'))return;
state={answers:{},checked:{},index:0,shuffle:state.shuffle,autoCheck:state.autoCheck,
salt:Math.floor(Math.random()*1e9),mistakes:state.mistakes,reviewAnswers:{},reviewChecked:{},reviewMode:false};
showResults=false;save();render();});
document.getElementById('jump').addEventListener('change',()=>{state.reviewMode=false;});
render();
})();
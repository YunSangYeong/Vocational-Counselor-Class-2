import { describe, expect, it } from 'vitest';
import { BASE_BANK as bank, SUBJECTS, validateQuestion, fingerprint, createExam, grade, emptyStore, answerExam, submitExam, restoreStore, remainingSeconds, startPractice, checkPractice, nextPractice, importQuestions, parseCsv } from '../src/model';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

describe('문제은행과 검수 범위', () => {
 it('실제 1000문항·과목별 200개·목표 부족 0·ID/본문/보기 중복 없음', () => {
  expect(bank.length).toBe(1000); expect(1000-bank.length).toBe(0);
  expect(new Set(bank.map(q=>q.id)).size).toBe(bank.length);
  expect(new Set(bank.map(fingerprint)).size).toBe(bank.length);
  for(const s of SUBJECTS) expect(bank.filter(q=>q.subject===s)).toHaveLength(200);
 });
 for(const q of bank) it(`${q.id}: 형식·유형·연도·권리·해설`, () => {
  expect(validateQuestion(q)).toEqual(q); expect(q.type).toBe('original');
  expect(q.verificationStatus).toBe('reviewed'); expect(q.year).toBeNull(); expect(q.session).toBeNull();
  if (q.family) expect(q.family).toBe(q.conceptId); expect(q.explanation.length).toBeGreaterThan(40);
  expect(q.rights).toContain('CC BY 4.0'); expect(q.reviewNote).toContain('외부');
 });
 it('가져오기 시 보기 순서 변경 중복 제거·pending 강제',()=>{
  const altered={...bank[0],id:'LOCAL',choices:[...bank[0].choices].reverse()};
  expect(importQuestions([altered],bank).duplicates).toBe(1);
  const fresh={...bank[0],id:'NEW',question:'검수 전 신규 문항'};
  expect(importQuestions([fresh],bank).added[0].verificationStatus).toBe('pending');
  expect(()=>importQuestions([fresh,{}],bank)).toThrow('2번');
 });
 it('CSV/JSON 양식이 실제 입력으로 유효',()=>{
  const csv=readFileSync('public/templates/questions.csv','utf8');
  expect(validateQuestion(parseCsv(csv)[0]).subject).toBe(SUBJECTS[0]);
  expect(validateQuestion(JSON.parse(readFileSync('public/templates/questions.json','utf8'))[0]).version).toBe('main');
 });
});
function scored(counts:number[]) {
 const e=createExam(bank,'main',1000); const used:Record<string,number>={};
 for(const q of e.questions) { used[q.subject]=(used[q.subject]||0)+1; if(used[q.subject]<=counts[SUBJECTS.indexOf(q.subject)])e.answers[q.id]=q.answer; }
 return e;
}
describe('직업상담사2급 학습용 잠정 시험 규칙',()=>{
 it('100문항·각20·150분·ID중복 없음·pending 제외',()=>{
  const e=createExam([...bank,{...bank[0],id:'WAIT',verificationStatus:'pending'}],'main',1000);
  expect(e.questions).toHaveLength(100); expect(new Set(e.questions.map(q=>q.id)).size).toBe(100);
  expect(e.deadline-e.startedAt).toBe(9000000); expect(e.questions.some(q=>q.id==='WAIT')).toBe(false);
  for(const s of SUBJECTS)expect(e.questions.filter(q=>q.subject===s)).toHaveLength(20);
  expect(()=>createExam([...bank.filter(q=>q.subject!==SUBJECTS[0]),...bank.filter(q=>q.subject===SUBJECTS[0]).slice(0,19)],'main')).toThrow();
 });
 it.each([[12,12,12,12,12,true],[11,12,12,12,12,false],[7,20,20,20,20,false],[8,13,13,13,13,true],[8,12,13,13,13,false]])('합격/과락 경계 %j',(...args)=>{
  const passed=args.pop();const e=scored(args as number[]);expect(grade(e).passed).toBe(passed);
 });
 it('미응답은 오답·과목 점수 분모는20',()=>{
  const g=grade(scored([0,0,0,0,0]));expect(g.unanswered).toBe(100);expect(g.wrong).toBe(100);expect(g.score).toBe(0);expect(g.subjects.every(s=>s.total===20)).toBe(true);
 });
 it('응답 변경·마감 직전 허용·마감 후 수정 금지·중복 제출 방지',()=>{
  let s={...emptyStore(),exam:createExam(bank,'main',1000)};
  const id=s.exam!.questions[0].id;s=answerExam(s,id,1,1001) as typeof s;s=answerExam(s,id,2,s.exam!.deadline-1) as typeof s;
  expect(s.exam!.answers[id]).toBe(2);const final=answerExam(s,id,3,s.exam!.deadline);
  expect(final.exam).toBeNull();expect(final.results[0].answers[id]).toBe(2);expect(final.results[0].reason).toBe('timeout');expect(submitExam(final)).toBe(final);
 });
 it('종료 시각 새로고침 복원·손상 데이터 거부',()=>{
  const s={...emptyStore(),exam:createExam(bank,'main',1000)};
  expect(restoreStore(JSON.stringify(s)).exam!.deadline).toBe(s.exam.deadline);
  expect(remainingSeconds(s.exam.deadline,s.exam.deadline+5000)).toBe(0);
  expect(()=>restoreStore('{broken')).toThrow();
  expect(()=>restoreStore(JSON.stringify({...s,exam:{...s.exam,deadline:s.exam.deadline+1}}))).toThrow();
 });
 it('연결 유형 우선 분산 후 보충 시 ID는 중복되지 않는다',()=>{
  const family=bank.map(q=>({...q,family:q.subject}));const e=createExam(family,'main');expect(new Set(e.questions.map(q=>q.id)).size).toBe(100);
 });
});
describe('랜덤·복습·보존',()=>{
 it('한 순회1000개 ID 중복 없음',()=>{
  let p=startPractice(bank,'main');const ids=[];
  for(let i=0;i<1000;i++){ids.push(p.currentId);p=nextPractice(p,bank);}
  expect(new Set(ids).size).toBe(1000);
 });
 it('즉시 채점은 1회만, 오답 재학습 정답이면 해제',()=>{
  const p=startPractice(bank,'main');const q=bank.find(q=>q.id===p.currentId)!;
  let s={...emptyStore(),practice:{...p,selected:q.answer%4+1}};
  s=checkPractice(s,bank) as typeof s;expect(s.wrongIds).toContain(q.id);expect(checkPractice(s,bank)).toBe(s);
  s={...s,practice:{...s.practice,selected:q.answer,revealed:false}};s=checkPractice(s,bank) as typeof s;
  expect(s.wrongIds).not.toContain(q.id);expect(s.attempts).toHaveLength(2);
 });
 it('결과30회·응답5000 보존 한도',()=>{
  let s=emptyStore();for(let i=0;i<51;i++)s=submitExam({...s,exam:createExam(bank,'main',i)},i+1);
  expect(s.results).toHaveLength(30);expect(s.attempts).toHaveLength(5000);
 });
});

// Existing localStorage references remain valid when the shared bank expands.
describe('확대 원고와 회귀',()=>{
 it('기존100개 객체 전체 보존',()=>{
  expect(createHash('sha256').update(JSON.stringify(bank.slice(0,100))).digest('hex')).toBe('d3885504e1c70c86489f991c661a25408ac44943581f5434e7bd993195077c28');
 });
 it('300개 연결개념 × 서로 다른 학습과제3개, 숫자변형 없음',()=>{
  const expanded=bank.slice(100);expect(expanded).toHaveLength(900);
  const concepts=new Set(expanded.map(q=>q.conceptId));expect(concepts.size).toBe(300);
  for(const id of concepts){
   const set=expanded.filter(q=>q.conceptId===id);expect(set).toHaveLength(3);
   expect(new Set(set.map(q=>q.itemFormat))).toEqual(new Set(['recall','application','critical']));
   expect(set[0].choices[set[0].answer-1]).toBe(set[1].choices[set[1].answer-1]);
   expect(set.every(q=>q.calculation===undefined)).toBe(true);
  }
 });
 it('새 은행에서도 실전시험은 연결개념을 중복 출제하지 않는다',()=>{
  for(let run=0;run<10;run++){
   const e=createExam(bank,'main');const ids=e.questions.filter(q=>q.family).map(q=>q.family);
   expect(new Set(ids).size).toBe(ids.length);
  }
 });
 it('정규화 본문 중복 없음·정답번호 분포 균형·새 메타데이터 검증',()=>{
  const stems=bank.map(q=>q.question.normalize('NFKC').replace(/\s/g,''));
  expect(new Set(stems).size).toBe(1000);
  for(let answer=1;answer<=4;answer++)expect(bank.filter(q=>q.answer===answer)).toHaveLength(250);
  expect(()=>validateQuestion({...bank[100],itemFormat:'invalid'})).toThrow('문제 형식');
  expect(()=>validateQuestion({...bank[100],conceptId:''})).toThrow('연결 개념');
 });
});

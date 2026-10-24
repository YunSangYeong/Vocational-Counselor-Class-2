"""순서 고정 자체 제작 원고 → JSON. 외부 기출/법정 수치 생성 없음."""
import json
from pathlib import Path
root=Path(__file__).resolve().parent.parent
rows=[]; subject=''; counts={}
for line in (root/'scripts/question-manuscript.txt').read_text().splitlines():
 if line.startswith('# '): subject=line[2:]; counts[subject]=0; continue
 if not line.strip(): continue
 topic,stem,answer,*rest=line.split('|')
 assert len(rest)==4, stem
 wrong=rest[:3]; explanation=rest[3]; counts[subject]+=1
 idx=len(rows); position=idx%4; choices=wrong[:]; choices.insert(position,answer)
 rows.append(dict(id=f'VC2-{list(counts).index(subject)+1}-{counts[subject]:03}',subject=subject,topic=topic,question=stem,choices=choices,answer=position+1,explanation=explanation,difficulty='하',year=None,session=None,type='original',sourceUrl='https://github.com/YunSangYeong/Vocational-Counselor-Class-2/blob/feat/vocational-counselor-cbt/docs/question-review.md',verificationStatus='reviewed',reviewNote='AI 일반 지식 기반 자체 제작. 원고 문장·정답·오답 내부 검토. 외부 자료 대조·전문가 검수·최신 공식 기준 대조 미완료. 법규 문항은 기본 개념과 확인 절차만 다루며 법정 수치·개별 법률 판단을 제공하지 않음.',version='main',rights='자체 제작 학습 문항 · CC BY 4.0. 외부 기출 원문을 사용하지 않음.'))
assert len(rows)==100 and all(n==20 for n in counts.values()),counts

# 추가 원고는 개념 확인 / 사례 적용 / 오개념 판별의 별도 과제를 담는다.
# family는 숫자 변형이 아니라 동일 개념의 연결 문항을 시험에서 분산하는 키다.
records=[]; group=''; subject=''
for line in (root/'scripts/expanded-manuscript.txt').read_text().splitlines():
 if line.startswith('# '):
  subject,group=line[2:].split(' :: ');continue
 if not line.strip():continue
 name,definition,case,misconception,correction=line.split('|')
 records.append(dict(subject=subject,group=group,name=name,definition=definition,case=case,misconception=misconception,correction=correction))
assert len(records)==300
concept_counts={s:0 for s in counts}
for record in records:
 subject=record['subject'];concept_counts[subject]+=1
 peers=[r for r in records if r['subject']==subject and r['group']==record['group']]
 assert len(peers)==6
 position=peers.index(record)
 concept=f'VC2-C{list(counts).index(subject)+1}-{concept_counts[subject]:03}'
 for mode in ['recall','application','critical']:
  if mode=='recall':
   stem=f"다음 설명에 해당하는 개념은?\n\n{record['definition']}."
   correct=record['name']; wrong=[peers[(position+i)%6]['name'] for i in [1,2,3]]
   explanation=f"핵심 개념: {record['name']}. 정의: {record['definition']}. {record['correction']}"
  elif mode=='application':
   stem=f"다음 사례에서 중심적으로 검토하는 개념은?\n\n{record['case']}"
   correct=record['name'];wrong=[peers[(position+i)%6]['name'] for i in [2,4,5]]
   explanation=f"사례에서 다룬 내용: {record['definition']}. 해당 개념은 ‘{record['name']}’이다. {record['correction']}"
  else:
   stem=f"다음 주장의 오류를 바로잡는 설명으로 가장 적절한 것은?\n\n“{record['misconception']}”"
   correct=record['correction'];wrong=[peers[(position+i)%6]['misconception'] for i in [1,3,5]]
   explanation=f"제시된 주장은 ‘{record['name']}’에 대한 오개념이다. {record['correction']} 정의: {record['definition']}."
  counts[subject]+=1; answer_position=len(rows)%4;choices=wrong[:];choices.insert(answer_position,correct)
  rows.append(dict(id=f'VC2-{list(counts).index(subject)+1}-{counts[subject]:03}',subject=subject,topic=f"{record['group']} · {record['name']}",question=stem,choices=choices,answer=answer_position+1,explanation=explanation,difficulty='하' if mode=='recall' else '중',year=None,session=None,type='original',sourceUrl='https://github.com/YunSangYeong/Vocational-Counselor-Class-2/blob/feat/vocational-counselor-cbt/docs/question-review.md',verificationStatus='reviewed',reviewNote='AI 일반 지식 기반 자체 제작. 개념·사례·오개념 원고의 정답·오답·해설을 내부 검토. 같은 개념의 서로 다른 학습 과제이며 연결 문항은 family로 표시. 외부 전문가 검수·공식 출제기준 대조 미완료. 법규는 기본 개념과 검토 절차이며 최신 법정 수치·개별 법률 판단이 아님.',version='main',rights='자체 제작 학습 문항 · CC BY 4.0. 외부 기출 원문을 사용하지 않음.',family=concept,conceptId=concept,itemFormat=mode))
assert len(rows)==1000 and all(n==200 for n in counts.values()),counts
normalize=lambda text:__import__('unicodedata').normalize('NFKC',''.join(text.split())).lower()
assert len({q['id'] for q in rows})==len(rows)
assert len({normalize(q['question']) for q in rows})==len(rows)
assert len({normalize('|'.join([q['question'],*sorted(q['choices'])])) for q in rows})==len(rows)
assert all(len(set(q['choices']))==4 and 1<=q['answer']<=4 for q in rows)
output=root/'src/data/questions.json'
temporary=output.with_suffix('.json.tmp')
temporary.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
temporary.replace(output)
print('최종',counts,'총:',len(rows),'부족:',1000-len(rows),'연결 개념:',len(records))

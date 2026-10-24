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
(root/'src/data/questions.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print(counts, 'total:', len(rows), 'shortfall:', 1000-len(rows))

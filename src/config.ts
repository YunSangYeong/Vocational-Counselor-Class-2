import profile from './qualification-profile.json';
export const EXAM_RULES = { questionCount: profile.exam.questionCount, durationMinutes: profile.exam.durationMinutes, perSubject: profile.exam.subjects[0].questionCount, passScore: profile.exam.scoring.passScore, subjectCutoff: profile.exam.scoring.subjectCutoffs[0].minimumScore, choiceCount: profile.exam.choiceCount };
export { profile };

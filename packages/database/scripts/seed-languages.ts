import { createPrismaClient } from '../src';
import {
  EnrollmentStatus,
  ExamQuestionType,
  LessonType,
  PracticeQuestionType,
  Prisma,
} from '../src/generated/prisma/client/client.js';

const prisma = createPrismaClient();

function toJson(v: unknown): Prisma.InputJsonValue {
  return v as Prisma.InputJsonValue;
}

// ─────────────────────────────────────────────────────────
// LANGUAGE DATA
// ─────────────────────────────────────────────────────────

const LANGUAGES = [
  {
    slug: 'tieng-trung-hsk1',
    title: 'Tiếng Trung HSK 1',
    activationCode: 'DEMO-TIENG-TRUNG',
    description: 'Khóa học tiếng Trung dành cho người mới bắt đầu, tương đương trình độ HSK 1.',
    units: [
      {
        title: 'Chào hỏi & Giới thiệu bản thân',
        order: 0,
        lessons: [
          {
            title: 'Bài 1: Video – Chào hỏi cơ bản trong tiếng Trung',
            type: LessonType.video,
            videoUrl: 'https://www.youtube.com/watch?v=V9y5DKBLNLM',
            duration: 12,
            order: 1,
          },
          {
            title: 'Bài 2: Từ vựng – Chào hỏi & Xã giao',
            type: LessonType.text,
            duration: 10,
            order: 2,
            content: `<h2>Từ vựng: Chào hỏi &amp; Xã giao</h2>
<table><thead><tr><th>Hán tự</th><th>Pinyin</th><th>Nghĩa</th></tr></thead><tbody>
<tr><td>你好</td><td>Nǐ hǎo</td><td>Xin chào</td></tr>
<tr><td>谢谢</td><td>Xièxiè</td><td>Cảm ơn</td></tr>
<tr><td>不客气</td><td>Bú kèqi</td><td>Không có gì</td></tr>
<tr><td>对不起</td><td>Duìbuqǐ</td><td>Xin lỗi</td></tr>
<tr><td>没关系</td><td>Méi guānxi</td><td>Không sao</td></tr>
<tr><td>再见</td><td>Zàijiàn</td><td>Tạm biệt</td></tr>
<tr><td>我叫...</td><td>Wǒ jiào...</td><td>Tôi tên là...</td></tr>
<tr><td>你叫什么名字？</td><td>Nǐ jiào shénme míngzi?</td><td>Bạn tên gì?</td></tr>
</tbody></table>
<h3>Mẫu câu hay dùng</h3>
<ul>
  <li><strong>你好！我叫阮文A。</strong> – Xin chào! Tôi tên là Nguyễn Văn A.</li>
  <li><strong>你叫什么名字？</strong> – Bạn tên gì?</li>
  <li><strong>很高兴认识你。</strong> – Rất vui được gặp bạn.</li>
</ul>`,
          },
        ],
        practiceQuestions: [
          {
            type: PracticeQuestionType.MULTIPLE_CHOICE,
            prompt: '"Xin chào" trong tiếng Trung là gì?',
            options: ['谢谢', '你好', '再见', '对不起'],
            correctAnswer: 1,
            explanation: '"你好" (Nǐ hǎo) có nghĩa là "Xin chào".',
            skillTags: ['VOCABULARY'],
          },
          {
            type: PracticeQuestionType.MULTIPLE_CHOICE,
            prompt: 'Câu "你叫什么名字？" có nghĩa là gì?',
            options: ['Bạn có khỏe không?', 'Bạn tên gì?', 'Bạn bao nhiêu tuổi?', 'Tạm biệt'],
            correctAnswer: 1,
            explanation: '"你叫什么名字？" nghĩa là "Bạn tên gì?".',
            skillTags: ['VOCABULARY', 'READING'],
          },
          {
            type: PracticeQuestionType.FILL_BLANK,
            prompt: 'Hoàn thành câu: "很高兴___你" (Rất vui được gặp bạn)',
            correctAnswer: '认识',
            explanation: '"很高兴认识你" = Rất vui được gặp bạn.',
            skillTags: ['GRAMMAR'],
          },
          {
            type: PracticeQuestionType.MATCHING,
            prompt: 'Nối từ tiếng Trung với nghĩa tiếng Việt:',
            options: toJson({
              left: ['谢谢', '对不起', '再见', '不客气'],
              right: ['Cảm ơn', 'Xin lỗi', 'Tạm biệt', 'Không có gì'],
            }),
            correctAnswer: toJson({
              谢谢: 'Cảm ơn',
              对不起: 'Xin lỗi',
              再见: 'Tạm biệt',
              不客气: 'Không có gì',
            }),
            skillTags: ['VOCABULARY'],
          },
          {
            type: PracticeQuestionType.ORDERING,
            prompt: 'Sắp xếp thành câu đúng: "Xin chào, tôi tên là Lan"',
            options: ['叫', '你好', '我', '兰'],
            correctAnswer: ['你好', '我', '叫', '兰'],
            explanation: '"你好，我叫兰" – Xin chào, tôi tên là Lan.',
            skillTags: ['GRAMMAR'],
          },
        ],
        examTitle: 'Kiểm tra cuối Unit 1 – Chào hỏi tiếng Trung',
        examQuestions: [
          {
            type: ExamQuestionType.MULTIPLE_CHOICE,
            prompt: '"Cảm ơn" trong tiếng Trung là?',
            options: ['你好', '再见', '谢谢', '没关系'],
            correctAnswer: 2,
            points: 2,
            skillTags: ['VOCABULARY'],
          },
          {
            type: ExamQuestionType.FILL_BLANK,
            prompt: 'Điền vào chỗ trống: "___！我叫王明。" (Xin chào! Tôi tên là Vương Minh.)',
            correctAnswer: '你好',
            points: 2,
            skillTags: ['VOCABULARY'],
          },
          {
            type: ExamQuestionType.MULTIPLE_CHOICE,
            prompt: 'Câu trả lời phù hợp cho "对不起" (Xin lỗi) là gì?',
            options: ['谢谢', '再见', '没关系', '你好'],
            correctAnswer: 2,
            points: 2,
            skillTags: ['VOCABULARY', 'READING'],
          },
        ],
      },
      {
        title: 'Số đếm & Ngày tháng',
        order: 1,
        lessons: [
          {
            title: 'Bài 3: Video – Số đếm 1-100',
            type: LessonType.video,
            videoUrl: 'https://www.youtube.com/watch?v=BxmFxYeqd8Q',
            duration: 15,
            order: 3,
          },
          {
            title: 'Bài 4: Từ vựng – Số đếm & Ngày tháng',
            type: LessonType.text,
            duration: 10,
            order: 4,
            content: `<h2>Số đếm trong tiếng Trung</h2>
<table><thead><tr><th>Số</th><th>Hán tự</th><th>Pinyin</th></tr></thead><tbody>
<tr><td>0</td><td>零</td><td>Líng</td></tr>
<tr><td>1</td><td>一</td><td>Yī</td></tr>
<tr><td>2</td><td>二</td><td>Èr</td></tr>
<tr><td>3</td><td>三</td><td>Sān</td></tr>
<tr><td>4</td><td>四</td><td>Sì</td></tr>
<tr><td>5</td><td>五</td><td>Wǔ</td></tr>
<tr><td>10</td><td>十</td><td>Shí</td></tr>
<tr><td>100</td><td>百</td><td>Bǎi</td></tr>
</tbody></table>
<h3>Ngày trong tuần</h3>
<ul>
  <li>星期一 (Xīngqīyī) – Thứ Hai</li>
  <li>星期二 (Xīngqīèr) – Thứ Ba</li>
  <li>星期五 (Xīngqīwǔ) – Thứ Sáu</li>
  <li>星期天 (Xīngqītiān) – Chủ Nhật</li>
</ul>`,
          },
        ],
        practiceQuestions: [
          {
            type: PracticeQuestionType.MULTIPLE_CHOICE,
            prompt: '"三" trong tiếng Trung đọc là gì?',
            options: ['Yī', 'Èr', 'Sān', 'Sì'],
            correctAnswer: 2,
            explanation: '"三" đọc là "Sān", nghĩa là số 3.',
            skillTags: ['VOCABULARY'],
          },
          {
            type: PracticeQuestionType.FILL_BLANK,
            prompt: 'Thứ Sáu trong tiếng Trung là "星期___"',
            correctAnswer: '五',
            explanation: 'Thứ Sáu là 星期五 (Xīngqīwǔ).',
            skillTags: ['VOCABULARY'],
          },
        ],
        examTitle: 'Kiểm tra Unit 2 – Số đếm',
        examQuestions: [
          {
            type: ExamQuestionType.MULTIPLE_CHOICE,
            prompt: '"五" có nghĩa là số mấy?',
            options: ['3', '4', '5', '6'],
            correctAnswer: 2,
            points: 2,
            skillTags: ['VOCABULARY'],
          },
          {
            type: ExamQuestionType.ORDERING,
            prompt: 'Sắp xếp số theo thứ tự tăng dần: 三, 一, 五, 二',
            options: ['三', '一', '五', '二'],
            correctAnswer: ['一', '二', '三', '五'],
            points: 3,
            skillTags: ['VOCABULARY'],
          },
        ],
      },
    ],
  },
  {
    slug: 'tieng-nhat-n5',
    title: 'Tiếng Nhật N5',
    activationCode: 'DEMO-TIENG-NHAT',
    description: 'Khóa học tiếng Nhật cơ bản dành cho người mới, tương đương JLPT N5.',
    units: [
      {
        title: 'Hiragana & Chào hỏi',
        order: 0,
        lessons: [
          {
            title: 'Bài 1: Video – Học bảng chữ cái Hiragana',
            type: LessonType.video,
            videoUrl: 'https://www.youtube.com/watch?v=6p9Il_j0zjc',
            duration: 15,
            order: 1,
          },
          {
            title: 'Bài 2: Từ vựng – Chào hỏi cơ bản',
            type: LessonType.text,
            duration: 12,
            order: 2,
            content: `<h2>Chào hỏi cơ bản trong tiếng Nhật</h2>
<table><thead><tr><th>Tiếng Nhật</th><th>Romaji</th><th>Nghĩa</th></tr></thead><tbody>
<tr><td>おはようございます</td><td>Ohayou gozaimasu</td><td>Chào buổi sáng</td></tr>
<tr><td>こんにちは</td><td>Konnichiwa</td><td>Xin chào (ban ngày)</td></tr>
<tr><td>こんばんは</td><td>Konbanwa</td><td>Chào buổi tối</td></tr>
<tr><td>ありがとう</td><td>Arigatou</td><td>Cảm ơn</td></tr>
<tr><td>すみません</td><td>Sumimasen</td><td>Xin lỗi / Cho hỏi</td></tr>
<tr><td>さようなら</td><td>Sayounara</td><td>Tạm biệt</td></tr>
<tr><td>はじめまして</td><td>Hajimemashite</td><td>Rất vui được gặp bạn</td></tr>
<tr><td>わたしは〜です</td><td>Watashi wa ~ desu</td><td>Tôi là ~</td></tr>
</tbody></table>
<h3>Bảng Hiragana cơ bản</h3>
<p>あ (a)・い (i)・う (u)・え (e)・お (o)</p>
<p>か (ka)・き (ki)・く (ku)・け (ke)・こ (ko)</p>
<p>さ (sa)・し (shi)・す (su)・せ (se)・そ (so)</p>`,
          },
        ],
        practiceQuestions: [
          {
            type: PracticeQuestionType.MULTIPLE_CHOICE,
            prompt: '"Xin chào (ban ngày)" trong tiếng Nhật là gì?',
            options: ['おはようございます', 'こんにちは', 'こんばんは', 'さようなら'],
            correctAnswer: 1,
            explanation: '"こんにちは" (Konnichiwa) là lời chào ban ngày.',
            skillTags: ['VOCABULARY'],
          },
          {
            type: PracticeQuestionType.MULTIPLE_CHOICE,
            prompt: '"Arigatou" có nghĩa là gì?',
            options: ['Xin lỗi', 'Tạm biệt', 'Cảm ơn', 'Xin chào'],
            correctAnswer: 2,
            explanation: '"ありがとう" (Arigatou) = Cảm ơn.',
            skillTags: ['VOCABULARY'],
          },
          {
            type: PracticeQuestionType.FILL_BLANK,
            prompt: 'Hoàn thành câu giới thiệu: "わたしは田中___。" (Tôi là Tanaka.)',
            correctAnswer: 'です',
            explanation: 'Cấu trúc: わたしは〜です = Tôi là ~.',
            skillTags: ['GRAMMAR'],
          },
          {
            type: PracticeQuestionType.MATCHING,
            prompt: 'Nối lời chào với thời điểm phù hợp:',
            options: toJson({
              left: ['おはようございます', 'こんにちは', 'こんばんは'],
              right: ['Buổi sáng', 'Buổi trưa/chiều', 'Buổi tối'],
            }),
            correctAnswer: toJson({
              おはようございます: 'Buổi sáng',
              こんにちは: 'Buổi trưa/chiều',
              こんばんは: 'Buổi tối',
            }),
            skillTags: ['VOCABULARY'],
          },
          {
            type: PracticeQuestionType.ORDERING,
            prompt: 'Sắp xếp thành câu đúng: "Tôi là học sinh"',
            options: ['がくせい', 'わたし', 'は', 'です'],
            correctAnswer: ['わたし', 'は', 'がくせい', 'です'],
            explanation: '"わたしはがくせいです" = Tôi là học sinh.',
            skillTags: ['GRAMMAR'],
          },
        ],
        examTitle: 'Kiểm tra Unit 1 – Hiragana & Chào hỏi',
        examQuestions: [
          {
            type: ExamQuestionType.MULTIPLE_CHOICE,
            prompt: '"Chào buổi sáng" trong tiếng Nhật là?',
            options: ['こんにちは', 'おはようございます', 'こんばんは', 'ありがとう'],
            correctAnswer: 1,
            points: 2,
            skillTags: ['VOCABULARY'],
          },
          {
            type: ExamQuestionType.FILL_BLANK,
            prompt: '"Rất vui được gặp bạn" trong tiếng Nhật là "___"',
            correctAnswer: 'はじめまして',
            points: 3,
            skillTags: ['VOCABULARY'],
          },
          {
            type: ExamQuestionType.MULTIPLE_CHOICE,
            prompt: 'Hiragana "き" đọc là gì?',
            options: ['ka', 'ki', 'ku', 'ko'],
            correctAnswer: 1,
            points: 2,
            skillTags: ['READING'],
          },
        ],
      },
      {
        title: 'Số đếm & Thời gian',
        order: 1,
        lessons: [
          {
            title: 'Bài 3: Video – Số đếm tiếng Nhật',
            type: LessonType.video,
            videoUrl: 'https://www.youtube.com/watch?v=Bqpd0AzEKzI',
            duration: 12,
            order: 3,
          },
          {
            title: 'Bài 4: Từ vựng – Số đếm 1-10 & Hỏi giờ',
            type: LessonType.text,
            duration: 10,
            order: 4,
            content: `<h2>Số đếm tiếng Nhật</h2>
<table><thead><tr><th>Số</th><th>Hiragana</th><th>Romaji</th></tr></thead><tbody>
<tr><td>1</td><td>いち</td><td>ichi</td></tr>
<tr><td>2</td><td>に</td><td>ni</td></tr>
<tr><td>3</td><td>さん</td><td>san</td></tr>
<tr><td>4</td><td>し/よん</td><td>shi/yon</td></tr>
<tr><td>5</td><td>ご</td><td>go</td></tr>
<tr><td>6</td><td>ろく</td><td>roku</td></tr>
<tr><td>7</td><td>しち/なな</td><td>shichi/nana</td></tr>
<tr><td>8</td><td>はち</td><td>hachi</td></tr>
<tr><td>9</td><td>く/きゅう</td><td>ku/kyuu</td></tr>
<tr><td>10</td><td>じゅう</td><td>juu</td></tr>
</tbody></table>
<h3>Hỏi &amp; Đáp giờ</h3>
<ul>
  <li>いま なんじ ですか？ – Bây giờ là mấy giờ?</li>
  <li>〜じ です。 – Bây giờ là ~ giờ.</li>
</ul>`,
          },
        ],
        practiceQuestions: [
          {
            type: PracticeQuestionType.MULTIPLE_CHOICE,
            prompt: '"さん" là số mấy?',
            options: ['1', '2', '3', '4'],
            correctAnswer: 2,
            skillTags: ['VOCABULARY'],
          },
          {
            type: PracticeQuestionType.FILL_BLANK,
            prompt: 'Số 5 trong tiếng Nhật là "___"',
            correctAnswer: 'ご',
            skillTags: ['VOCABULARY'],
          },
        ],
        examTitle: 'Kiểm tra Unit 2 – Số đếm',
        examQuestions: [
          {
            type: ExamQuestionType.MULTIPLE_CHOICE,
            prompt: '"Hachi" là số mấy?',
            options: ['6', '7', '8', '9'],
            correctAnswer: 2,
            points: 2,
            skillTags: ['VOCABULARY'],
          },
        ],
      },
    ],
  },
  {
    slug: 'tieng-han-so-cap',
    title: 'Tiếng Hàn Sơ Cấp',
    activationCode: 'DEMO-TIENG-HAN',
    description:
      'Khóa học tiếng Hàn dành cho người mới bắt đầu, học bảng chữ Hangul và giao tiếp cơ bản.',
    units: [
      {
        title: 'Bảng chữ Hangul & Chào hỏi',
        order: 0,
        lessons: [
          {
            title: 'Bài 1: Video – Học bảng chữ cái Hangul',
            type: LessonType.video,
            videoUrl: 'https://www.youtube.com/watch?v=85qJXvyFrIc',
            duration: 18,
            order: 1,
          },
          {
            title: 'Bài 2: Từ vựng – Chào hỏi & Giới thiệu',
            type: LessonType.text,
            duration: 12,
            order: 2,
            content: `<h2>Chào hỏi cơ bản trong tiếng Hàn</h2>
<table><thead><tr><th>Tiếng Hàn</th><th>Phiên âm</th><th>Nghĩa</th></tr></thead><tbody>
<tr><td>안녕하세요</td><td>Annyeonghaseyo</td><td>Xin chào</td></tr>
<tr><td>감사합니다</td><td>Gamsahamnida</td><td>Cảm ơn</td></tr>
<tr><td>죄송합니다</td><td>Joesonghamnida</td><td>Xin lỗi</td></tr>
<tr><td>괜찮아요</td><td>Gwaenchanayo</td><td>Không sao</td></tr>
<tr><td>안녕히 가세요</td><td>Annyeonghi gaseyo</td><td>Tạm biệt (người ở lại nói)</td></tr>
<tr><td>반갑습니다</td><td>Bangapseumnida</td><td>Rất vui được gặp bạn</td></tr>
<tr><td>저는 〜입니다</td><td>Jeoneun ~ imnida</td><td>Tôi là ~</td></tr>
<tr><td>이름이 뭐예요?</td><td>Ireumi mwoyeyo?</td><td>Bạn tên gì?</td></tr>
</tbody></table>
<h3>Phụ âm Hangul cơ bản</h3>
<p>ㄱ(g/k) ㄴ(n) ㄷ(d/t) ㄹ(r/l) ㅁ(m) ㅂ(b/p) ㅅ(s) ㅇ(ng/-) ㅈ(j) ㅎ(h)</p>
<h3>Nguyên âm cơ bản</h3>
<p>ㅏ(a) ㅓ(eo) ㅗ(o) ㅜ(u) ㅡ(eu) ㅣ(i) ㅐ(ae) ㅔ(e)</p>`,
          },
        ],
        practiceQuestions: [
          {
            type: PracticeQuestionType.MULTIPLE_CHOICE,
            prompt: '"Xin chào" trong tiếng Hàn là gì?',
            options: ['감사합니다', '죄송합니다', '안녕하세요', '안녕히 가세요'],
            correctAnswer: 2,
            explanation: '"안녕하세요" (Annyeonghaseyo) là lời chào phổ biến nhất.',
            skillTags: ['VOCABULARY'],
          },
          {
            type: PracticeQuestionType.MULTIPLE_CHOICE,
            prompt: '"Gamsahamnida" có nghĩa là gì?',
            options: ['Xin lỗi', 'Tạm biệt', 'Xin chào', 'Cảm ơn'],
            correctAnswer: 3,
            explanation: '"감사합니다" = Cảm ơn.',
            skillTags: ['VOCABULARY'],
          },
          {
            type: PracticeQuestionType.FILL_BLANK,
            prompt: 'Hoàn thành câu giới thiệu: "저는 민준___." (Tôi là Minjun.)',
            correctAnswer: '입니다',
            explanation: 'Cấu trúc: 저는 〜입니다 = Tôi là ~.',
            skillTags: ['GRAMMAR'],
          },
          {
            type: PracticeQuestionType.MATCHING,
            prompt: 'Nối từ tiếng Hàn với nghĩa tiếng Việt:',
            options: toJson({
              left: ['안녕하세요', '감사합니다', '죄송합니다', '괜찮아요'],
              right: ['Xin chào', 'Cảm ơn', 'Xin lỗi', 'Không sao'],
            }),
            correctAnswer: toJson({
              안녕하세요: 'Xin chào',
              감사합니다: 'Cảm ơn',
              죄송합니다: 'Xin lỗi',
              괜찮아요: 'Không sao',
            }),
            skillTags: ['VOCABULARY'],
          },
          {
            type: PracticeQuestionType.ORDERING,
            prompt: 'Sắp xếp thành câu đúng: "Tôi là học sinh"',
            options: ['학생', '저는', '입니다'],
            correctAnswer: ['저는', '학생', '입니다'],
            explanation: '"저는 학생입니다" = Tôi là học sinh.',
            skillTags: ['GRAMMAR'],
          },
        ],
        examTitle: 'Kiểm tra Unit 1 – Hangul & Chào hỏi',
        examQuestions: [
          {
            type: ExamQuestionType.MULTIPLE_CHOICE,
            prompt: '"Cảm ơn" trong tiếng Hàn là?',
            options: ['안녕하세요', '죄송합니다', '감사합니다', '괜찮아요'],
            correctAnswer: 2,
            points: 2,
            skillTags: ['VOCABULARY'],
          },
          {
            type: ExamQuestionType.FILL_BLANK,
            prompt: '"Rất vui được gặp bạn" trong tiếng Hàn là "___"',
            correctAnswer: '반갑습니다',
            points: 3,
            skillTags: ['VOCABULARY'],
          },
          {
            type: ExamQuestionType.MULTIPLE_CHOICE,
            prompt: 'Câu "이름이 뭐예요?" nghĩa là gì?',
            options: ['Bạn bao nhiêu tuổi?', 'Bạn tên gì?', 'Bạn có khỏe không?', 'Tạm biệt'],
            correctAnswer: 1,
            points: 2,
            skillTags: ['VOCABULARY', 'READING'],
          },
        ],
      },
      {
        title: 'Số đếm & Mua sắm',
        order: 1,
        lessons: [
          {
            title: 'Bài 3: Video – Số đếm tiếng Hàn',
            type: LessonType.video,
            videoUrl: 'https://www.youtube.com/watch?v=m9_-E5k5r7E',
            duration: 14,
            order: 3,
          },
          {
            title: 'Bài 4: Từ vựng – Số đếm Sino-Korean',
            type: LessonType.text,
            duration: 10,
            order: 4,
            content: `<h2>Số đếm Sino-Korean (한자어)</h2>
<table><thead><tr><th>Số</th><th>Hangul</th><th>Phiên âm</th></tr></thead><tbody>
<tr><td>1</td><td>일</td><td>il</td></tr>
<tr><td>2</td><td>이</td><td>i</td></tr>
<tr><td>3</td><td>삼</td><td>sam</td></tr>
<tr><td>4</td><td>사</td><td>sa</td></tr>
<tr><td>5</td><td>오</td><td>o</td></tr>
<tr><td>6</td><td>육</td><td>yuk</td></tr>
<tr><td>7</td><td>칠</td><td>chil</td></tr>
<tr><td>8</td><td>팔</td><td>pal</td></tr>
<tr><td>9</td><td>구</td><td>gu</td></tr>
<tr><td>10</td><td>십</td><td>sip</td></tr>
</tbody></table>
<h3>Mua sắm</h3>
<ul>
  <li>얼마예요? – Bao nhiêu tiền?</li>
  <li>〜원이에요. – ... Won.</li>
  <li>깎아 주세요. – Giảm giá cho tôi với.</li>
</ul>`,
          },
        ],
        practiceQuestions: [
          {
            type: PracticeQuestionType.MULTIPLE_CHOICE,
            prompt: '"삼" là số mấy?',
            options: ['1', '2', '3', '4'],
            correctAnswer: 2,
            skillTags: ['VOCABULARY'],
          },
          {
            type: PracticeQuestionType.FILL_BLANK,
            prompt: '"Bao nhiêu tiền?" trong tiếng Hàn là "___"',
            correctAnswer: '얼마예요?',
            skillTags: ['VOCABULARY'],
          },
        ],
        examTitle: 'Kiểm tra Unit 2 – Số đếm',
        examQuestions: [
          {
            type: ExamQuestionType.MULTIPLE_CHOICE,
            prompt: '"오" là số mấy?',
            options: ['3', '4', '5', '6'],
            correctAnswer: 2,
            points: 2,
            skillTags: ['VOCABULARY'],
          },
        ],
      },
    ],
  },
  {
    slug: 'tieng-anh-giao-tiep',
    title: 'Tiếng Anh Giao Tiếp',
    activationCode: 'DEMO-TIENG-ANH',
    description:
      'Khóa học tiếng Anh giao tiếp thực tế hàng ngày, tập trung vào các tình huống thực dụng.',
    units: [
      {
        title: 'Giới thiệu & Gặp gỡ',
        order: 0,
        lessons: [
          {
            title: 'Bài 1: Video – Introducing yourself in English',
            type: LessonType.video,
            videoUrl: 'https://www.youtube.com/watch?v=1cBmW46Sd6A',
            duration: 12,
            order: 1,
          },
          {
            title: 'Bài 2: Từ vựng – Greetings & Small Talk',
            type: LessonType.text,
            duration: 10,
            order: 2,
            content: `<h2>Greetings &amp; Small Talk</h2>
<table><thead><tr><th>Tiếng Anh</th><th>Nghĩa</th></tr></thead><tbody>
<tr><td>How are you?</td><td>Bạn có khỏe không?</td></tr>
<tr><td>I'm fine, thank you.</td><td>Tôi khỏe, cảm ơn.</td></tr>
<tr><td>Nice to meet you.</td><td>Rất vui được gặp bạn.</td></tr>
<tr><td>What do you do?</td><td>Bạn làm nghề gì?</td></tr>
<tr><td>I'm a student / teacher / engineer.</td><td>Tôi là học sinh / giáo viên / kỹ sư.</td></tr>
<tr><td>Where are you from?</td><td>Bạn đến từ đâu?</td></tr>
<tr><td>I'm from Vietnam.</td><td>Tôi đến từ Việt Nam.</td></tr>
<tr><td>See you later!</td><td>Hẹn gặp lại!</td></tr>
</tbody></table>
<h3>Mẫu hội thoại</h3>
<blockquote>
<p>A: Hi! My name is Lan. What's your name?</p>
<p>B: Hello! I'm John. Nice to meet you, Lan.</p>
<p>A: Nice to meet you too. Where are you from?</p>
<p>B: I'm from the USA. And you?</p>
<p>A: I'm from Vietnam.</p>
</blockquote>`,
          },
        ],
        practiceQuestions: [
          {
            type: PracticeQuestionType.MULTIPLE_CHOICE,
            prompt: 'Which is the correct response to "How are you?"',
            options: [
              "I'm from Vietnam.",
              'Nice to meet you.',
              "I'm fine, thank you.",
              'See you later!',
            ],
            correctAnswer: 2,
            explanation: '"I\'m fine, thank you." is the standard positive response.',
            skillTags: ['VOCABULARY'],
          },
          {
            type: PracticeQuestionType.MULTIPLE_CHOICE,
            prompt: '"Where are you from?" có nghĩa là gì?',
            options: ['Bạn tên gì?', 'Bạn làm nghề gì?', 'Bạn đến từ đâu?', 'Bạn bao nhiêu tuổi?'],
            correctAnswer: 2,
            explanation: '"Where are you from?" = Bạn đến từ đâu?',
            skillTags: ['VOCABULARY', 'READING'],
          },
          {
            type: PracticeQuestionType.FILL_BLANK,
            prompt: 'Complete: "___ to meet you." (Rất vui được gặp bạn.)',
            correctAnswer: 'Nice',
            explanation: '"Nice to meet you." là câu xã giao khi gặp người lần đầu.',
            skillTags: ['VOCABULARY'],
          },
          {
            type: PracticeQuestionType.MATCHING,
            prompt: 'Match the English phrases with Vietnamese meanings:',
            options: toJson({
              left: ['How are you?', 'What do you do?', 'See you later!', 'Nice to meet you.'],
              right: [
                'Bạn có khỏe không?',
                'Bạn làm nghề gì?',
                'Hẹn gặp lại!',
                'Rất vui được gặp bạn.',
              ],
            }),
            correctAnswer: toJson({
              'How are you?': 'Bạn có khỏe không?',
              'What do you do?': 'Bạn làm nghề gì?',
              'See you later!': 'Hẹn gặp lại!',
              'Nice to meet you.': 'Rất vui được gặp bạn.',
            }),
            skillTags: ['VOCABULARY'],
          },
          {
            type: PracticeQuestionType.ORDERING,
            prompt: 'Arrange to make a correct sentence: "My name is Anna."',
            options: ['is', 'name', 'Anna', 'My'],
            correctAnswer: ['My', 'name', 'is', 'Anna'],
            skillTags: ['GRAMMAR'],
          },
        ],
        examTitle: 'Test Unit 1 – Greetings',
        examQuestions: [
          {
            type: ExamQuestionType.MULTIPLE_CHOICE,
            prompt: "What is the correct question to ask someone's profession?",
            options: [
              'Where are you from?',
              'What do you do?',
              'How are you?',
              "What's your name?",
            ],
            correctAnswer: 1,
            points: 2,
            skillTags: ['VOCABULARY'],
          },
          {
            type: ExamQuestionType.FILL_BLANK,
            prompt: 'Complete: "I\'m ___ Vietnam." (Tôi đến từ Việt Nam.)',
            correctAnswer: 'from',
            points: 2,
            skillTags: ['GRAMMAR'],
          },
          {
            type: ExamQuestionType.MULTIPLE_CHOICE,
            prompt: 'Which phrase means "Hẹn gặp lại!"?',
            options: ['Nice to meet you!', 'How are you?', 'See you later!', "I'm fine."],
            correctAnswer: 2,
            points: 2,
            skillTags: ['VOCABULARY'],
          },
        ],
      },
      {
        title: 'Tình huống hàng ngày',
        order: 1,
        lessons: [
          {
            title: 'Bài 3: Video – Ordering food at a restaurant',
            type: LessonType.video,
            videoUrl: 'https://www.youtube.com/watch?v=r9-eXSCi0Bs',
            duration: 14,
            order: 3,
          },
          {
            title: 'Bài 4: Từ vựng – At the restaurant & Shopping',
            type: LessonType.text,
            duration: 12,
            order: 4,
            content: `<h2>At the Restaurant</h2>
<table><thead><tr><th>Tiếng Anh</th><th>Nghĩa</th></tr></thead><tbody>
<tr><td>A table for two, please.</td><td>Cho tôi bàn 2 người.</td></tr>
<tr><td>May I see the menu?</td><td>Cho tôi xem menu được không?</td></tr>
<tr><td>I'd like to order...</td><td>Tôi muốn gọi...</td></tr>
<tr><td>What do you recommend?</td><td>Bạn gợi ý món gì?</td></tr>
<tr><td>The bill, please.</td><td>Tính tiền cho tôi.</td></tr>
<tr><td>It's delicious!</td><td>Món này ngon quá!</td></tr>
</tbody></table>
<h2>Shopping</h2>
<table><thead><tr><th>Tiếng Anh</th><th>Nghĩa</th></tr></thead><tbody>
<tr><td>How much is this?</td><td>Cái này bao nhiêu tiền?</td></tr>
<tr><td>Can I try it on?</td><td>Tôi có thể thử không?</td></tr>
<tr><td>Do you have it in a different size?</td><td>Bạn có size khác không?</td></tr>
<tr><td>I'll take it.</td><td>Tôi mua cái này.</td></tr>
</tbody></table>`,
          },
        ],
        practiceQuestions: [
          {
            type: PracticeQuestionType.MULTIPLE_CHOICE,
            prompt: 'How do you ask for the bill at a restaurant?',
            options: [
              'May I see the menu?',
              'What do you recommend?',
              'The bill, please.',
              "I'd like to order.",
            ],
            correctAnswer: 2,
            skillTags: ['VOCABULARY'],
          },
          {
            type: PracticeQuestionType.FILL_BLANK,
            prompt: 'Complete: "___ much is this?" (Cái này bao nhiêu tiền?)',
            correctAnswer: 'How',
            skillTags: ['VOCABULARY', 'GRAMMAR'],
          },
        ],
        examTitle: 'Test Unit 2 – Daily Situations',
        examQuestions: [
          {
            type: ExamQuestionType.MULTIPLE_CHOICE,
            prompt: '"Món này ngon quá!" in English is?',
            options: [
              "I'd like to order.",
              'The bill, please.',
              "It's delicious!",
              'Can I try it on?',
            ],
            correctAnswer: 2,
            points: 2,
            skillTags: ['VOCABULARY'],
          },
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────
// MAIN SEED
// ─────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Bắt đầu seed 4 khóa học ngôn ngữ đầy đủ nội dung...');

  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error('Tenant not found');

  const student = await prisma.user.findFirst({ where: { email: 'student@lms.com' } });
  if (!student) throw new Error('Student not found');

  console.log(`📦 Tenant: ${tenant.name}`);
  console.log('🗑️  Xóa dữ liệu khóa học cũ...');
  await prisma.course.deleteMany({ where: { tenantId: tenant.id } });

  for (const lang of LANGUAGES) {
    console.log(`\n📚 Tạo khóa học: ${lang.title}`);

    const course = await prisma.course.create({
      data: {
        title: lang.title,
        slug: lang.slug,
        description: lang.description,
        tenantId: tenant.id,
        totalDuration: 60,
        isActive: true,
      },
    });

    // Tạo từng unit
    for (const unitData of lang.units) {
      const unit = await prisma.courseUnit.create({
        data: {
          title: unitData.title,
          order: unitData.order,
          tenantId: tenant.id,
          courseId: course.id,
        },
      });

      // Tạo bài học lý thuyết
      for (const lessonData of unitData.lessons) {
        await prisma.lesson.create({
          data: {
            title: lessonData.title,
            type: lessonData.type,
            videoUrl: lessonData.type === LessonType.video ? lessonData.videoUrl : null,
            content: lessonData.type === LessonType.text ? lessonData.content : null,
            duration: lessonData.duration,
            order: lessonData.order,
            unitId: unit.id,
            tenantId: tenant.id,
            courseId: course.id,
          },
        });
      }

      const nextOrder = unitData.lessons[unitData.lessons.length - 1].order;

      // Tạo câu hỏi luyện tập
      const practiceQuestionIds: string[] = [];
      for (const qData of unitData.practiceQuestions) {
        const options =
          qData.type === PracticeQuestionType.MULTIPLE_CHOICE
            ? toJson(qData.options)
            : qData.type === PracticeQuestionType.ORDERING
              ? toJson(qData.options)
              : qData.options !== undefined
                ? qData.options
                : undefined;

        const q = await prisma.practiceQuestion.create({
          data: {
            tenantId: tenant.id,
            courseId: course.id,
            unitId: unit.id,
            type: qData.type,
            prompt: qData.prompt,
            options: options as Prisma.InputJsonValue | undefined,
            correctAnswer: toJson(qData.correctAnswer),
            ...('explanation' in qData ? { explanation: qData.explanation } : {}),
            skillTags: qData.skillTags,
          },
        });
        practiceQuestionIds.push(q.id);
      }

      // Tạo bộ luyện tập
      const practiceSet = await prisma.practiceExerciseSet.create({
        data: {
          tenantId: tenant.id,
          courseId: course.id,
          unitId: unit.id,
          title: `Luyện tập – ${unitData.title}`,
          description: `Bộ câu hỏi luyện tập cho unit "${unitData.title}"`,
          isPublished: true,
        },
      });

      // Liên kết câu hỏi vào bộ luyện tập
      for (let i = 0; i < practiceQuestionIds.length; i++) {
        await prisma.practiceExerciseSetQuestion.create({
          data: {
            tenantId: tenant.id,
            exerciseSetId: practiceSet.id,
            questionId: practiceQuestionIds[i],
            order: i,
          },
        });
      }

      // Tạo bài học luyện tập
      await prisma.lesson.create({
        data: {
          title: `Luyện tập – ${unitData.title}`,
          type: LessonType.practice,
          duration: 20,
          order: nextOrder + 1,
          unitId: unit.id,
          tenantId: tenant.id,
          courseId: course.id,
          practiceExerciseSetId: practiceSet.id,
        },
      });

      // Tạo bài kiểm tra
      const exam = await prisma.exam.create({
        data: {
          tenantId: tenant.id,
          courseId: course.id,
          unitId: unit.id,
          title: unitData.examTitle,
          description: `Bài kiểm tra cuối unit "${unitData.title}"`,
          durationMinutes: 20,
          passingScore: 60,
          isPublished: true,
        },
      });

      const examSection = await prisma.examSection.create({
        data: {
          tenantId: tenant.id,
          examId: exam.id,
          title: 'Câu hỏi kiểm tra',
          order: 0,
        },
      });

      for (let i = 0; i < unitData.examQuestions.length; i++) {
        const eq = unitData.examQuestions[i];
        await prisma.examQuestion.create({
          data: {
            tenantId: tenant.id,
            sectionId: examSection.id,
            type: eq.type,
            prompt: eq.prompt,
            options: eq.options !== undefined ? toJson(eq.options) : undefined,
            correctAnswer: toJson(eq.correctAnswer),
            ...('explanation' in eq ? { explanation: eq.explanation as string | undefined } : {}),
            points: eq.points ?? 2,
            skillTags: eq.skillTags,
            order: i,
          },
        });
      }

      // Tạo bài học kiểm tra
      await prisma.lesson.create({
        data: {
          title: `Kiểm tra – ${unitData.title}`,
          type: LessonType.exam,
          duration: 20,
          order: nextOrder + 2,
          unitId: unit.id,
          tenantId: tenant.id,
          courseId: course.id,
          examId: exam.id,
        },
      });

      console.log(
        `  ✅ Unit "${unitData.title}": ${unitData.lessons.length} bài lý thuyết, ${practiceQuestionIds.length} câu luyện tập, ${unitData.examQuestions.length} câu kiểm tra`,
      );
    }

    // Tạo mã kích hoạt
    await prisma.activationCode.create({
      data: {
        tenantId: tenant.id,
        code: lang.activationCode,
        description: `Mã kích hoạt khóa học ${lang.title}`,
        maxUses: 100,
        courseId: course.id,
        isActive: true,
      },
    });

    // Ghi danh học viên demo
    await prisma.courseEnrollment.create({
      data: {
        tenantId: tenant.id,
        courseId: course.id,
        userId: student.id,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    console.log(`  🎫 Mã kích hoạt: ${lang.activationCode}`);
  }

  console.log('\n✅ Seed hoàn tất!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

export {};

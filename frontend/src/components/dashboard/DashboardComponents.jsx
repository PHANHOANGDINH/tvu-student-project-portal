import { Alert, Button, Empty, List, Progress, Skeleton, Tag, Typography } from 'antd'
import { PageContainer, ProCard, ProTable, StatisticCard } from '@ant-design/pro-components'
import { ReloadOutlined } from '@ant-design/icons'
import { getRoleLabel, getStatusLabel, STATUS_COLORS } from '../../constants/uiLabels'
import { formatDateTimeVi, submissionStatusLabel } from '../../utils/formatters'

export const AppPageContainer = props => <PageContainer ghost header={{ title: props.title, subTitle: props.description, extra: props.extra }}>{props.children}</PageContainer>
export const AppStatCard = ({ title, value, icon }) => <StatisticCard statistic={{ title, value: value ?? 0, prefix: icon }} />
export const AppChartCard = ({ title, description, children, empty }) => <ProCard title={title} tooltip={description} className="app-chart-card" bordered>{empty ? <AppEmptyState description="Chưa có dữ liệu để hiển thị" /> : <div role="img" aria-label={`${title}. ${description || ''}`} className="app-chart-body">{children}</div>}</ProCard>
export const AppTable = props => <ProTable search={false} options={false} pagination={false} {...props} />
export const AppStatusTag = ({ status }) => <Tag color={STATUS_COLORS[status] || 'blue'}>{getStatusLabel(status)}</Tag>
export const AppEmptyState = ({ description = 'Chưa có dữ liệu' }) => <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} />
export const AppErrorState = ({ message, onRetry }) => <Alert type="error" showIcon message={message} action={<Button icon={<ReloadOutlined />} onClick={onRetry}>Thử lại</Button>} />
export const AppLoadingState = () => <ProCard><Skeleton active paragraph={{ rows: 8 }} /></ProCard>
export const CourseClassCard = ({ course }) => <ProCard title={course.code} subTitle={course.subjectName} bordered><Typography.Text type="secondary">{course.semesterName} · {course.academicYearName}</Typography.Text></ProCard>
export const GroupProgressCard = ({ item }) => <ProCard bordered><Typography.Text strong>{item.label}</Typography.Text><Progress percent={Number(item.value || 0)} /></ProCard>
export const DeadlineCard = ({ item }) => <List.Item><List.Item.Meta title={item.title} description={`${item.classCode} · ${formatDateTimeVi(item.deadline)}`} /></List.Item>
const activityStatusLabel = value => ['ADMIN', 'LECTURER', 'STUDENT'].includes(String(value).toUpperCase()) ? getRoleLabel(value) : submissionStatusLabel(value)
export const RecentActivityList = ({ items = [] }) => items.length ? <List className="recent-activity-list" dataSource={items} renderItem={item => <List.Item><List.Item.Meta title={<Typography.Text strong>{item.title}</Typography.Text>} description={`${activityStatusLabel(item.status)} · ${formatDateTimeVi(item.createdAt)}`} /></List.Item>} /> : <AppEmptyState description="Chưa có hoạt động gần đây" />

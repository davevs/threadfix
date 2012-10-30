<%@ include file="/common/taglibs.jsp"%>

<head>
	<title>Manage Users</title>
</head>

<body id="config">
	<form:form modelAttribute="error" name="formErrors">
		<form:errors cssClass="errors" />
	</form:form>

	<h2>Manage Users</h2>
	
	<div id="helpText">
		Here you can create, edit, and delete users.
	</div>

	<table class="formattedTable">
		<thead>
			<tr>
				<th class="medium first">User</th>
				<th class="short">Edit</th>
				<th class="short">Delete</th>
			</tr>
		</thead>
		<tbody id="userTableBody">
		<c:forEach var="userModel" items="${ userModels }">
			<tr class="bodyRow">
				<td>
					<spring:url value="users/{userId}" var="userUrl">
						<spring:param name="userId" value="${ userModel.user.id }" />
					</spring:url>
					<a href="${ fn:escapeXml(userUrl) }"><c:out value="${ userModel.user.name }"/></a>
				</td>
				<td>
					<spring:url value="users/{userId}/edit" var="editUrl">
						<spring:param name="userId" value="${ userModel.user.id }"/>
					</spring:url>
					<a id="editLink" href="${ fn:escapeXml(editUrl) }">Edit</a>
				</td>
				<td>
					<spring:url value="/configuration/users/{userId}/delete" var="deleteUrl">
						<spring:param name="userId" value="${ userModel.user.id }"/>
					</spring:url>
					<form id="command" method="POST" action="${ fn:escapeXml(deleteUrl) }">
					<c:choose>
						<c:when test="${ not userModel.deletable }">
							<input id="delete1" type="submit" value="Delete" onclick="javascript:alert('You cannot delete this account because doing so would leave the system without users with the ability to manage either users, groups, or roles.'); return false;"/>
						</c:when>
						<c:when test="${ userModel.thisUser }">
							<input id="delete1" type="submit" value="Delete" onclick="return confirm('This is your account. Are you sure you want to remove yourself from the system?')"/>
						</c:when>
						<c:otherwise>
							<input id="delete1" type="submit" value="Delete" onclick="return confirm('Are you sure you want to delete this User?')"/>
						</c:otherwise>
					</c:choose>
					</form>
				</td>
			</tr>
		</c:forEach>
			<tr class="footer">
				<td colspan="3" class="first">
					<a id="addUserLink" href="<spring:url value="users/new" />">Add User</a> |
					<a id="backToConfigLink" href="<spring:url value='/configuration'/>">Back To Configuration Index</a>
				</td>
				<td colspan="1" class="last pagination" style="text-align:right"></td>
			</tr>
		</tbody>
	</table>
</body>